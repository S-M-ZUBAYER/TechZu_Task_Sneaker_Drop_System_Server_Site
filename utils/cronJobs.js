import cron from 'node-cron';
import { Reservation, Drop, sequelize } from '../models/index.js';
import { Op, Transaction } from 'sequelize';

/**
 * Cron Jobs for Reservation Expiration
 * Automatically returns stock when reservations expire
 */

/**
 * Process expired reservations
 * Returns stock to drops and marks reservations as expired
 */
export const processExpiredReservations = async (io) => {
    const transaction = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
        const now = new Date();

        // Find all active reservations that have expired
        const expiredReservations = await Reservation.findAll({
            where: {
                status: 'active',
                expires_at: {
                    [Op.lt]: now,
                },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (expiredReservations.length === 0) {
            await transaction.commit();
            return;
        }

        console.log(`⏰ Processing ${expiredReservations.length} expired reservations...`);

        // Group by drop_id to batch stock updates
        const dropStockUpdates = {};

        for (const reservation of expiredReservations) {
            // Mark reservation as expired
            reservation.status = 'expired';
            await reservation.save({ transaction });

            // Accumulate stock to return
            if (!dropStockUpdates[reservation.drop_id]) {
                dropStockUpdates[reservation.drop_id] = 0;
            }
            dropStockUpdates[reservation.drop_id] += 1;

            console.log(`  ↳ Reservation #${reservation.id} expired (Drop #${reservation.drop_id})`);
        }

        // Update stock for each drop
        for (const [dropId, stockToReturn] of Object.entries(dropStockUpdates)) {
            const drop = await Drop.findByPk(dropId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (drop) {
                const oldStock = drop.stock;
                drop.stock += stockToReturn;
                await drop.save({ transaction });

                console.log(`  ✅ Drop #${dropId}: Stock ${oldStock} → ${drop.stock} (+${stockToReturn})`);

                // Emit socket event for stock update
                if (io) {
                    io.emit('stockUpdate', {
                        dropId: drop.id,
                        newStock: drop.stock,
                        reason: 'reservation_expired',
                    });

                    io.emit('reservationExpired', {
                        dropId: drop.id,
                        stockReturned: stockToReturn,
                    });
                }
            }
        }

        await transaction.commit();
        console.log(`✅ Successfully processed ${expiredReservations.length} expired reservations`);
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        console.error('❌ Error processing expired reservations:', error.message);
    }
};

/**
 * Start cron job for reservation expiration
 * @param {Object} io - Socket.IO instance
 */
export const startReservationExpirationJob = (io) => {
    const cronInterval = process.env.CRON_INTERVAL || '*/10 * * * * *';

    console.log(`🕐 Starting reservation expiration cron job (${cronInterval})`);

    // Run every 10 seconds (configurable via .env)
    cron.schedule(cronInterval, async () => {
        await processExpiredReservations(io);
    });

    console.log('✅ Reservation expiration cron job started');
};

/**
 * Manual trigger for testing
 * @param {Object} io - Socket.IO instance
 */
export const triggerExpirationCheck = async (io) => {
    console.log('🔄 Manually triggering expiration check...');
    await processExpiredReservations(io);
};

export default {
    startReservationExpirationJob,
    processExpiredReservations,
    triggerExpirationCheck,
};