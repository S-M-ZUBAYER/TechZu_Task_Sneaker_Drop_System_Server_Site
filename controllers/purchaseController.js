import { Purchase, Reservation, Drop, User, sequelize } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Purchase Controller
 * Handles purchase completion from reservations
 */

/**
 * @desc    Complete purchase from reservation
 * @route   POST /api/purchases
 * @access  Private
 */
export const completePurchase = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { reservationId } = req.body;
        const userId = req.user.id;

        // Find and lock reservation
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId,
                user_id: userId,
                status: 'active',
            },
            include: [
                {
                    model: Drop,
                    as: 'drop',
                },
            ],
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

        // Check if reservation is expired
        if (reservation.isExpired()) {
            if (!transaction.finished) await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Reservation has expired',
            });
        }

        // Mark reservation as completed
        reservation.status = 'completed';
        await reservation.save({ transaction });

        // Create purchase record
        const purchase = await Purchase.create(
            {
                user_id: userId,
                drop_id: reservation.drop_id,
                price: reservation.drop.price,
                purchased_at: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('purchaseCompleted', {
                dropId: reservation.drop_id,
                purchaser: {
                    id: req.user.id,
                    username: req.user.username,
                },
                purchaseId: purchase.id,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Purchase completed successfully',
            data: {
                purchase: {
                    id: purchase.id,
                    drop_id: purchase.drop_id,
                    price: purchase.price,
                    purchased_at: purchase.purchased_at,
                },
                drop: {
                    id: reservation.drop.id,
                    name: reservation.drop.name,
                },
            },
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        next(error);
    }
};

/**
 * @desc    Get user's purchases
 * @route   GET /api/purchases/user
 * @access  Private
 */
export const getUserPurchases = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: purchases } = await Purchase.findAndCountAll({
            where: { user_id: userId },
            include: [
                {
                    model: Drop,
                    as: 'drop',
                    attributes: ['id', 'name', 'image_url', 'description'],
                },
            ],
            order: [['purchased_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            success: true,
            count: purchases.length,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: {
                purchases,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get purchases for a specific drop
 * @route   GET /api/purchases/drop/:dropId
 * @access  Public
 */
export const getDropPurchases = async (req, res, next) => {
    try {
        const { dropId } = req.params;
        const { limit = 3 } = req.query;

        const purchases = await Purchase.findAll({
            where: { drop_id: dropId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username'],
                },
            ],
            order: [['purchased_at', 'DESC']],
            limit: parseInt(limit),
        });

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: {
                purchases,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get purchase by ID
 * @route   GET /api/purchases/:id
 * @access  Private
 */
export const getPurchaseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const purchase = await Purchase.findOne({
            where: {
                id,
                user_id: userId,
            },
            include: [
                {
                    model: Drop,
                    as: 'drop',
                },
            ],
        });

        if (!purchase) {
            throw new AppError('Purchase not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                purchase,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all purchases (admin)
 * @route   GET /api/purchases
 * @access  Private (Admin)
 */
export const getAllPurchases = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: purchases } = await Purchase.findAndCountAll({
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
            order: [['purchased_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            success: true,
            count: purchases.length,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: {
                purchases,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get purchase statistics
 * @route   GET /api/purchases/stats
 * @access  Private (Admin)
 */
export const getPurchaseStats = async (req, res, next) => {
    try {
        const totalPurchases = await Purchase.count();
        const totalRevenue = await Purchase.sum('price');

        const purchasesByDrop = await Purchase.findAll({
            attributes: [
                'drop_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('price')), 'revenue'],
            ],
            include: [
                {
                    model: Drop,
                    as: 'drop',
                    attributes: ['name'],
                },
            ],
            group: ['drop_id'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total_purchases: totalPurchases,
                    total_revenue: parseFloat(totalRevenue || 0),
                    purchases_by_drop: purchasesByDrop,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    completePurchase,
    getUserPurchases,
    getDropPurchases,
    getPurchaseById,
    getAllPurchases,
    getPurchaseStats,
};