import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Import configurations
import { testConnection, syncDatabase } from './config/database.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import dropRoutes from './routes/dropRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import utilities
import { startReservationExpirationJob } from './utils/cronJobs.js';
import { initializeSocketHandlers } from './utils/socketHandlers.js';

// Import Swagger
import { setupSwagger } from './docs/swagger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// ========================================
// MIDDLEWARE
// ========================================

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Make io accessible in routes
app.set('io', io);

// ========================================
// ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/purchases', purchaseRoutes);

// Setup Swagger documentation
setupSwagger(app);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ========================================
// SOCKET.IO
// ========================================

// Initialize Socket.IO event handlers
initializeSocketHandlers(io);

// ========================================
// SERVER STARTUP
// ========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log('🚀 Starting Sneaker Drop System Backend...');
        console.log('==========================================');

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }

        // Sync database models
        // ⚠️ IMPORTANT: Use schema.sql file instead of auto-sync to avoid foreign key issues
        // Set to true ONLY if you want to drop and recreate ALL tables
        const forceSync = process.env.FORCE_SYNC === 'true';

        if (process.env.AUTO_SYNC === 'true') {
            console.log('⚠️  Auto-sync is enabled. Using schema.sql is recommended instead.');
            await syncDatabase(forceSync);
        } else {
            console.log('✅ Auto-sync disabled. Make sure to run schema.sql manually.');
            console.log('   Run: mysql -u smzubayer -p -h 43.154.22.219 -P 3308 tht-after-sales-service < schema.sql');
        }

        // Start cron jobs
        console.log('🕐 Starting scheduled tasks...');
        startReservationExpirationJob(io);

        // Start HTTP server
        // httpServer.listen(PORT, () => {
        //     console.log('==========================================');
        //     console.log(`✅ Server running on http://localhost:${PORT}`);
        //     console.log(`🔌 WebSocket server ready`);
        //     console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
        //     console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        //     console.log(`📊 Database: ${process.env.DB_NAME}`);
        //     console.log('==========================================');
        // });
        app.get("/", (req, res) => {
            res.json({ message: "Sneaker Drop System API working on Vercel 🚀" });
        });

        // Graceful shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    // Close Socket.IO connections
    io.close(() => {
        console.log('✅ Socket.IO connections closed');
    });

    // Close HTTP server
    httpServer.close(async () => {
        console.log('✅ HTTP server closed');

        // Close database connection
        const { closeConnection } = await import('./config/database.js');
        await closeConnection();

        console.log('👋 Server stopped successfully');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Start the server
startServer();

// Export for testing
export { app, io, httpServer };