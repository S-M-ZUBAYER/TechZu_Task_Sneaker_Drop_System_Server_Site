/**
 * Socket.IO Event Handlers
 * Manages real-time WebSocket connections and events
 */

/**
 * Initialize Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
export const initializeSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        /**
         * Client joins a drop room to receive updates
         */
        socket.on('joinDrop', (dropId) => {
            const roomName = `drop_${dropId}`;
            socket.join(roomName);
            console.log(`📍 Socket ${socket.id} joined room: ${roomName}`);

            socket.emit('joinedDrop', {
                dropId,
                message: `Subscribed to updates for drop ${dropId}`,
            });
        });

        /**
         * Client leaves a drop room
         */
        socket.on('leaveDrop', (dropId) => {
            const roomName = `drop_${dropId}`;
            socket.leave(roomName);
            console.log(`📤 Socket ${socket.id} left room: ${roomName}`);

            socket.emit('leftDrop', {
                dropId,
                message: `Unsubscribed from updates for drop ${dropId}`,
            });
        });

        /**
         * Client requests current stock for a drop
         */
        socket.on('requestStock', async (dropId) => {
            try {
                const { Drop } = await import('../models/index.js');
                const drop = await Drop.findByPk(dropId);

                if (drop) {
                    socket.emit('stockUpdate', {
                        dropId: drop.id,
                        newStock: drop.stock,
                        timestamp: new Date(),
                    });
                } else {
                    socket.emit('error', {
                        message: 'Drop not found',
                        dropId,
                    });
                }
            } catch (error) {
                console.error('Error fetching stock:', error);
                socket.emit('error', {
                    message: 'Error fetching stock',
                });
            }
        });

        /**
         * Ping/Pong for connection health check
         */
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: new Date(),
            });
        });

        /**
         * Client disconnect
         */
        socket.on('disconnect', (reason) => {
            console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        });

        /**
         * Handle connection errors
         */
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    // Log total connections periodically
    setInterval(() => {
        const connectedSockets = io.sockets.sockets.size;
        if (connectedSockets > 0) {
            console.log(`🔌 Active WebSocket connections: ${connectedSockets}`);
        }
    }, 60000); // Every minute
};

/**
 * Emit stock update to all clients in a drop room
 * @param {Object} io - Socket.IO instance
 * @param {number} dropId - Drop ID
 * @param {number} newStock - Updated stock count
 */
export const emitStockUpdate = (io, dropId, newStock) => {
    const roomName = `drop_${dropId}`;
    io.to(roomName).emit('stockUpdate', {
        dropId,
        newStock,
        timestamp: new Date(),
    });

    // Also broadcast to all clients
    io.emit('stockUpdate', {
        dropId,
        newStock,
        timestamp: new Date(),
    });
};

/**
 * Emit reservation created event
 * @param {Object} io - Socket.IO instance
 * @param {Object} data - Reservation data
 */
export const emitReservationCreated = (io, data) => {
    io.emit('reservationCreated', {
        ...data,
        timestamp: new Date(),
    });
};

/**
 * Emit reservation expired event
 * @param {Object} io - Socket.IO instance
 * @param {Object} data - Expiration data
 */
export const emitReservationExpired = (io, data) => {
    io.emit('reservationExpired', {
        ...data,
        timestamp: new Date(),
    });
};

/**
 * Emit purchase completed event
 * @param {Object} io - Socket.IO instance
 * @param {Object} data - Purchase data
 */
export const emitPurchaseCompleted = (io, data) => {
    io.emit('purchaseCompleted', {
        ...data,
        timestamp: new Date(),
    });
};

/**
 * Emit new drop created event
 * @param {Object} io - Socket.IO instance
 * @param {Object} drop - Drop data
 */
export const emitNewDrop = (io, drop) => {
    io.emit('newDrop', {
        drop,
        timestamp: new Date(),
    });
};

/**
 * Broadcast a custom event to all clients
 * @param {Object} io - Socket.IO instance
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
export const broadcastEvent = (io, eventName, data) => {
    io.emit(eventName, {
        ...data,
        timestamp: new Date(),
    });
};

export default {
    initializeSocketHandlers,
    emitStockUpdate,
    emitReservationCreated,
    emitReservationExpired,
    emitPurchaseCompleted,
    emitNewDrop,
    broadcastEvent,
};