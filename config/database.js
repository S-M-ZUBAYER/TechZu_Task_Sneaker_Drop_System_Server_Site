import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log(process.env.DB_NAME);

// Create Sequelize instance with MySQL configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'sneaker_drop_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // Connection pool configuration
        pool: {
            max: 10,        // Maximum number of connections
            min: 0,         // Minimum number of connections
            acquire: 30000, // Maximum time (ms) to get connection
            idle: 10000,    // Maximum time (ms) connection can be idle
        },

        // Default model options
        define: {
            timestamps: true,      // Add createdAt and updatedAt
            underscored: true,     // Use snake_case for columns
            freezeTableName: true, // Don't pluralize table names
        },

        // Timezone configuration
        timezone: '+00:00',
    }
);

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        console.log(`📊 Connected to: ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        return false;
    }
};

/**
 * Sync all models with database
 * @param {boolean} force - Drop tables before sync (DANGEROUS!)
 * @returns {Promise<void>}
 */
export const syncDatabase = async (force = false) => {
    try {
        if (force) {
            console.warn('⚠️  WARNING: Force sync will DROP all tables!');
        }

        await sequelize.sync({ force, alter: !force });

        if (force) {
            console.log('🔄 Database force synchronized (tables recreated).');
        } else {
            console.log('✅ Database synchronized successfully.');
        }
    } catch (error) {
        console.error('❌ Database sync error:', error.message);
        throw error;
    }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export const closeConnection = async () => {
    try {
        await sequelize.close();
        console.log('👋 Database connection closed.');
    } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
    }
};

export default sequelize;