import { Reservation, Drop, User, sequelize } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Op, Transaction } from 'sequelize';

/**
 * Reservation Controller
 * Handles atomic reservations with race condition prevention
 */

/**
 * @desc    Reserve an item (ATOMIC - Race condition safe)
 * @route   POST /api/reservations
 * @access  Private
 */
export const reserveItem = async (req, res, next) => {
    const transaction = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
        const { dropId } = req.body;
        const userId = req.user.id;

        // Check if user already has an active reservation for this drop
        const existingReservation = await Reservation.findOne({
            where: {
                user_id: userId,
                drop_id: dropId,
                status: 'active',
                expires_at: {
                    [Op.gt]: new Date(),
                },
            },
            transaction,
        });

        if (existingReservation) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'You already have an active reservation for this drop',
            });
        }

        // Lock the drop row for update (CRITICAL FOR RACE CONDITION PREVENTION)
        const drop = await Drop.findOne({
            where: { id: dropId },
            lock: transaction.LOCK.UPDATE, // Row-level lock
            transaction,
        });

        if (!drop) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Drop not found',
            });
        }

        // Check if drop has started
        if (!drop.hasStarted()) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Drop has not started yet',
            });
        }

        // Check if stock is available (ATOMIC CHECK)
        if (drop.stock <= 0) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Out of stock',
            });
        }

        // Decrease stock by 1 (ATOMIC OPERATION)
        drop.stock -= 1;
        await drop.save({ transaction });

        // Create reservation
        const expirationDuration = parseInt(process.env.RESERVATION_DURATION) || 60000;
        const expiresAt = new Date(Date.now() + expirationDuration);

        const reservation = await Reservation.create(
            {
                user_id: userId,
                drop_id: dropId,
                status: 'active',
                expires_at: expiresAt,
            },
            { transaction }
        );

        // Commit transaction
        await transaction.commit();

        // Emit socket event for stock update
        const io = req.app.get('io');
        if (io) {
            io.emit('stockUpdate', {
                dropId: drop.id,
                newStock: drop.stock,
                reservedBy: req.user.username,
            });

            io.emit('reservationCreated', {
                reservationId: reservation.id,
                dropId: drop.id,
                userId: userId,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Item reserved successfully',
            data: {
                reservation: {
                    id: reservation.id,
                    drop_id: reservation.drop_id,
                    status: reservation.status,
                    expires_at: reservation.expires_at,
                    remaining_seconds: reservation.getRemainingTime(),
                },
                drop: {
                    id: drop.id,
                    name: drop.name,
                    stock: drop.stock,
                },
            },
        });
    } catch (error) {
        // Only rollback if transaction hasn't been committed or rolled back
        if (!transaction.finished) {
            await transaction.rollback();
        }
        next(error);
    }
};

/**
 * @desc    Get user's reservations
 * @route   GET /api/reservations/user
 * @access  Private
 */
export const getUserReservations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        const whereClause = { user_id: userId };

        if (status) {
            whereClause.status = status;
        }

        const reservations = await Reservation.findAll({
            where: whereClause,
            include: [
                {
                    model: Drop,
                    as: 'drop',
                    attributes: ['id', 'name', 'price', 'image_url'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: {
                reservations: reservations.map((r) => ({
                    ...r.toJSON(),
                    is_active: r.isActive(),
                    is_expired: r.isExpired(),
                    remaining_seconds: r.getRemainingTime(),
                })),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reservation by ID
 * @route   GET /api/reservations/:id
 * @access  Private
 */
export const getReservationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const reservation = await Reservation.findOne({
            where: { id, user_id: userId },
            include: [
                {
                    model: Drop,
                    as: 'drop',
                },
            ],
        });

        if (!reservation) {
            throw new AppError('Reservation not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                reservation: {
                    ...reservation.toJSON(),
                    is_active: reservation.isActive(),
                    is_expired: reservation.isExpired(),
                    remaining_seconds: reservation.getRemainingTime(),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel reservation (return stock)
 * @route   DELETE /api/reservations/:id
 * @access  Private
 */
export const cancelReservation = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find reservation
        const reservation = await Reservation.findOne({
            where: {
                id,
                user_id: userId,
                status: 'active',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!reservation) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Active reservation not found',
            });
        }

        // Mark as expired
        reservation.status = 'expired';
        await reservation.save({ transaction });

        // Return stock to drop
        const drop = await Drop.findOne({
            where: { id: reservation.drop_id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (drop) {
            drop.stock += 1;
            await drop.save({ transaction });
        }

        await transaction.commit();

        // Emit socket event
        const io = req.app.get('io');
        if (io && drop) {
            io.emit('stockUpdate', {
                dropId: drop.id,
                newStock: drop.stock,
            });

            io.emit('reservationCancelled', {
                reservationId: reservation.id,
                dropId: drop.id,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully',
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        next(error);
    }
};

/**
 * @desc    Get all active reservations (admin)
 * @route   GET /api/reservations
 * @access  Private (Admin)
 */
export const getAllReservations = async (req, res, next) => {
    try {
        const { status = 'active' } = req.query;

        const reservations = await Reservation.findAll({
            where: { status },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email'],
                },
                {
                    model: Drop,
                    as: 'drop',
                    attributes: ['id', 'name', 'price'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: {
                reservations,
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    reserveItem,
    getUserReservations,
    getReservationById,
    cancelReservation,
    getAllReservations,
};