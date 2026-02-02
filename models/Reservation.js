import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Reservation Model
 * Handles 60-second temporary item reservations
 */
const Reservation = sequelize.define('reservations', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    drop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'drops',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'completed'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'expired', 'completed']],
                msg: 'Status must be active, expired, or completed',
            },
        },
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: {
                msg: 'Expires at must be a valid date',
            },
            isFuture(value) {
                if (this.isNewRecord && new Date(value) <= new Date()) {
                    throw new Error('Expiration time must be in the future');
                }
            },
        },
    },
}, {
    timestamps: true,
    underscored: true,
    tableName: 'reservations',
    freezeTableName: true,

    indexes: [
        {
            unique: false,
            fields: ['user_id', 'drop_id'],
            name: 'idx_user_drop',
        },
        {
            unique: false,
            fields: ['expires_at', 'status'],
            name: 'idx_expires_status',
        },
        {
            unique: false,
            fields: ['status'],
            name: 'idx_status',
        },
    ],

    hooks: {
        /**
         * Set expiration time before creating reservation
         */
        beforeCreate: (reservation) => {
            if (!reservation.expires_at) {
                const expirationDuration = parseInt(process.env.RESERVATION_DURATION) || 60000;
                reservation.expires_at = new Date(Date.now() + expirationDuration);
            }
        },
    },
});

/**
 * Instance method to check if reservation is expired
 * @returns {boolean} - True if reservation has expired
 */
Reservation.prototype.isExpired = function () {
    return new Date() > new Date(this.expires_at) || this.status === 'expired';
};

/**
 * Instance method to check if reservation is active
 * @returns {boolean} - True if reservation is active and not expired
 */
Reservation.prototype.isActive = function () {
    return this.status === 'active' && !this.isExpired();
};

/**
 * Instance method to get remaining time in seconds
 * @returns {number} - Seconds remaining (0 if expired)
 */
Reservation.prototype.getRemainingTime = function () {
    const now = new Date();
    const expiresAt = new Date(this.expires_at);
    const diff = expiresAt - now;
    return Math.max(0, Math.floor(diff / 1000));
};

/**
 * Instance method to mark as expired
 * @returns {Promise<Reservation>} - Updated reservation
 */
Reservation.prototype.markExpired = async function () {
    this.status = 'expired';
    return await this.save();
};

/**
 * Instance method to mark as completed
 * @returns {Promise<Reservation>} - Updated reservation
 */
Reservation.prototype.markCompleted = async function () {
    this.status = 'completed';
    return await this.save();
};

export default Reservation;