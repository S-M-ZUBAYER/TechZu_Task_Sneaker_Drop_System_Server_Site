import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Drop Model
 * Represents a sneaker drop with inventory tracking
 */
const Drop = sequelize.define('drops', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Drop name cannot be empty',
            },
            len: {
                args: [3, 255],
                msg: 'Drop name must be between 3 and 255 characters',
            },
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: {
                msg: 'Stock must be an integer',
            },
            min: {
                args: [0],
                msg: 'Stock cannot be negative',
            },
        },
    },
    initial_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: {
                msg: 'Initial stock must be an integer',
            },
            min: {
                args: [0],
                msg: 'Initial stock cannot be negative',
            },
        },
    },
    image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'Must be a valid URL',
            },
        },
    },
    drop_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: {
                msg: 'Must be a valid date',
            },
        },
    },
}, {
    timestamps: true,
    underscored: true,
    tableName: 'drops',

    hooks: {
        /**
         * Validate stock doesn't exceed initial stock before update
         */
        beforeUpdate: (drop) => {
            if (drop.stock > drop.initial_stock) {
                throw new Error('Stock cannot exceed initial stock');
            }
        },
    },
});

/**
 * Instance method to check if drop is available
 * @returns {boolean} - True if stock is available
 */
Drop.prototype.isAvailable = function () {
    return this.stock > 0;
};

/**
 * Instance method to check if drop has started
 * @returns {boolean} - True if drop has started
 */
Drop.prototype.hasStarted = function () {
    if (!this.drop_start_time) return true;
    return new Date() >= new Date(this.drop_start_time);
};

/**
 * Instance method to get stock percentage
 * @returns {number} - Percentage of stock remaining
 */
Drop.prototype.getStockPercentage = function () {
    if (this.initial_stock === 0) return 0;
    return Math.round((this.stock / this.initial_stock) * 100);
};

export default Drop;