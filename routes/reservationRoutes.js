import express from 'express';
import {
    reserveItem,
    getUserReservations,
    getReservationById,
    cancelReservation,
    getAllReservations,
} from '../controllers/reservationController.js';
import { authenticate } from '../middleware/auth.js';
import {
    validateReserve,
    validateIdParam,
} from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Item reservation management
 */

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Reserve an item (atomic operation)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dropId
 *             properties:
 *               dropId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Item reserved successfully
 *       400:
 *         description: Out of stock or already reserved
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validateReserve, reserveItem);

/**
 * @swagger
 * /api/reservations/user:
 *   get:
 *     summary: Get current user's reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, completed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of user reservations
 */
router.get('/user', authenticate, getUserReservations);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
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
 *         description: Reservation details
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, validateIdParam, getReservationById);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Cancel reservation (returns stock)
 *     tags: [Reservations]
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
 *         description: Reservation cancelled successfully
 *       404:
 *         description: Reservation not found
 */
router.delete('/:id', authenticate, validateIdParam, cancelReservation);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations (admin)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, completed]
 *     responses:
 *       200:
 *         description: List of all reservations
 */
router.get('/', authenticate, getAllReservations);

export default router;