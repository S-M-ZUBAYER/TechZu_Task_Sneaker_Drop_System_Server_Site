import { Drop, Purchase, User } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Op } from 'sequelize';

/**
 * Drop Controller
 * Handles sneaker drop CRUD operations
 */

/**
 * @desc    Get all drops with recent purchasers
 * @route   GET /api/drops
 * @access  Public
 */
export const getAllDrops = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        // Build where clause for search
        const whereClause = search
            ? {
                name: {
                    [Op.like]: `%${search}%`,
                },
            }
            : {};

        const { count, rows: drops } = await Drop.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Purchase,
                    as: 'purchases',
                    limit: 3,
                    order: [['purchased_at', 'DESC']],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username'],
                        },
                    ],
                    required: false,
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: drops.length,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: {
                drops,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single drop by ID
 * @route   GET /api/drops/:id
 * @access  Public
 */
export const getDropById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drop = await Drop.findByPk(id, {
            include: [
                {
                    model: Purchase,
                    as: 'purchases',
                    limit: 3,
                    order: [['purchased_at', 'DESC']],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username'],
                        },
                    ],
                    required: false,
                },
            ],
        });

        if (!drop) {
            throw new AppError('Drop not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                drop,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new drop
 * @route   POST /api/drops
 * @access  Private (Admin only in production)
 */
export const createDrop = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            initial_stock,
            image_url,
            drop_start_time,
        } = req.body;

        const drop = await Drop.create({
            name,
            description,
            price,
            stock,
            initial_stock,
            image_url,
            drop_start_time,
        });

        // Emit socket event for new drop
        const io = req.app.get('io');
        if (io) {
            io.emit('newDrop', {
                drop,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Drop created successfully',
            data: {
                drop,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update drop
 * @route   PUT /api/drops/:id
 * @access  Private (Admin only in production)
 */
export const updateDrop = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const drop = await Drop.findByPk(id);

        if (!drop) {
            throw new AppError('Drop not found', 404);
        }

        // Update allowed fields
        const allowedFields = [
            'name',
            'description',
            'price',
            'stock',
            'image_url',
            'drop_start_time',
        ];

        allowedFields.forEach((field) => {
            if (updates[field] !== undefined) {
                drop[field] = updates[field];
            }
        });

        await drop.save();

        // Emit socket event for drop update
        const io = req.app.get('io');
        if (io) {
            io.emit('dropUpdated', {
                drop,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Drop updated successfully',
            data: {
                drop,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete drop
 * @route   DELETE /api/drops/:id
 * @access  Private (Admin only in production)
 */
export const deleteDrop = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drop = await Drop.findByPk(id);

        if (!drop) {
            throw new AppError('Drop not found', 404);
        }

        await drop.destroy();

        // Emit socket event for drop deletion
        const io = req.app.get('io');
        if (io) {
            io.emit('dropDeleted', {
                dropId: id,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Drop deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get drop statistics
 * @route   GET /api/drops/:id/stats
 * @access  Public
 */
export const getDropStats = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drop = await Drop.findByPk(id);

        if (!drop) {
            throw new AppError('Drop not found', 404);
        }

        const totalPurchases = await Purchase.count({
            where: { drop_id: id },
        });

        const stats = {
            id: drop.id,
            name: drop.name,
            total_stock: drop.initial_stock,
            remaining_stock: drop.stock,
            sold: drop.initial_stock - drop.stock,
            total_purchases: totalPurchases,
            stock_percentage: drop.getStockPercentage(),
            is_available: drop.isAvailable(),
            has_started: drop.hasStarted(),
        };

        res.status(200).json({
            success: true,
            data: {
                stats,
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAllDrops,
    getDropById,
    createDrop,
    updateDrop,
    deleteDrop,
    getDropStats,
};