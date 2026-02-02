import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Purchase Model
 * Represents completed transactions
 */
const Purchase = sequelize.define('purchases', {
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
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'Price must be a valid decimal number',
            },
            min: {
                args: [0],
                msg: 'Price must be greater than or equal to 0',
            },
        },
        get() {
            const value = this.getDataValue('price');
            return value ? parseFloat(value) : 0;
        },
    },
    purchased_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    underscored: true,
    tableName: 'purchases',
    freezeTableName: true,

    indexes: [
        {
            unique: false,
            fields: ['drop_id', 'purchased_at'],
            name: 'idx_drop_purchased',
        },
        {
            unique: false,
            fields: ['user_id'],
            name: 'idx_user',
        },
        {
            unique: false,
            fields: ['purchased_at'],
            name: 'idx_purchased_at',
        },
    ],

    hooks: {
        /**
         * Set purchased_at timestamp before creating
         */
        beforeCreate: (purchase) => {
            if (!purchase.purchased_at) {
                purchase.purchased_at = new Date();
            }
        },
    },
});

/**
 * Instance method to get time since purchase
 * @returns {string} - Human readable time difference
 */
Purchase.prototype.getTimeSincePurchase = function () {
    const now = new Date();
    const purchasedAt = new Date(this.purchased_at);
    const diffMs = now - purchasedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
};

export default Purchase;