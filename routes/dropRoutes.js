import express from 'express';
import {
    getAllDrops,
    getDropById,
    createDrop,
    updateDrop,
    deleteDrop,
    getDropStats,
} from '../controllers/dropController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
    validateCreateDrop,
    validateUpdateDrop,
    validateIdParam,
    validatePagination,
} from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Drops
 *   description: Sneaker drop management
 */

/**
 * @swagger
 * /api/drops:
 *   get:
 *     summary: Get all drops with pagination
 *     tags: [Drops]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *     responses:
 *       200:
 *         description: List of drops with recent purchasers
 */
router.get('/', validatePagination, getAllDrops);

/**
 * @swagger
 * /api/drops/{id}:
 *   get:
 *     summary: Get drop by ID
 *     tags: [Drops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Drop details
 *       404:
 *         description: Drop not found
 */
router.get('/:id', validateIdParam, getDropById);

/**
 * @swagger
 * /api/drops/{id}/stats:
 *   get:
 *     summary: Get drop statistics
 *     tags: [Drops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Drop statistics
 */
router.get('/:id/stats', validateIdParam, getDropStats);

/**
 * @swagger
 * /api/drops:
 *   post:
 *     summary: Create new drop
 *     tags: [Drops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - initial_stock
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               initial_stock:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               drop_start_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Drop created successfully
 */
router.post('/', authenticate, validateCreateDrop, createDrop);

/**
 * @swagger
 * /api/drops/{id}:
 *   put:
 *     summary: Update drop
 *     tags: [Drops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Drop updated successfully
 */
router.put('/:id', authenticate, validateUpdateDrop, updateDrop);

/**
 * @swagger
 * /api/drops/{id}:
 *   delete:
 *     summary: Delete drop
 *     tags: [Drops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Drop deleted successfully
 */
router.delete('/:id', authenticate, validateIdParam, deleteDrop);

export default router;