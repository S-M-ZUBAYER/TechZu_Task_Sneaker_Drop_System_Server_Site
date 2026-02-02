import express from 'express';
import {
    completePurchase,
    getUserPurchases,
    getDropPurchases,
    getPurchaseById,
    getAllPurchases,
    getPurchaseStats,
} from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/auth.js';
import {
    validatePurchase,
    validateIdParam,
    validatePagination,
} from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Purchase management
 */

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Complete purchase from reservation
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *             properties:
 *               reservationId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Purchase completed successfully
 *       400:
 *         description: Reservation expired or invalid
 *       404:
 *         description: Reservation not found
 */
router.post('/', authenticate, validatePurchase, completePurchase);

/**
 * @swagger
 * /api/purchases/user:
 *   get:
 *     summary: Get current user's purchases
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user purchases
 */
router.get('/user', authenticate, validatePagination, getUserPurchases);

/**
 * @swagger
 * /api/purchases/drop/{dropId}:
 *   get:
 *     summary: Get recent purchases for a drop
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: dropId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of recent purchases (default 3)
 *     responses:
 *       200:
 *         description: List of recent purchasers
 */
router.get('/drop/:dropId', validateIdParam, getDropPurchases);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Purchases]
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
 *         description: Purchase details
 *       404:
 *         description: Purchase not found
 */
router.get('/:id', authenticate, validateIdParam, getPurchaseById);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get all purchases (admin)
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all purchases
 */
router.get('/', authenticate, validatePagination, getAllPurchases);

/**
 * @swagger
 * /api/purchases/stats:
 *   get:
 *     summary: Get purchase statistics (admin)
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase statistics
 */
router.get('/stats', authenticate, getPurchaseStats);

export default router;