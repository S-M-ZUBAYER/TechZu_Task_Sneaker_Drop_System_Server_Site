import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * Handles user authentication and profile data
 */
const User = sequelize.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_username',
            msg: 'Username already exists',
        },
        validate: {
            notEmpty: {
                msg: 'Username cannot be empty',
            },
            len: {
                args: [3, 50],
                msg: 'Username must be between 3 and 50 characters',
            },
            isAlphanumeric: {
                msg: 'Username can only contain letters and numbers',
            },
        },
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            name: 'unique_email',
            msg: 'Email already exists',
        },
        validate: {
            notEmpty: {
                msg: 'Email cannot be empty',
            },
            isEmail: {
                msg: 'Must be a valid email address',
            },
        },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Password cannot be empty',
            },
            len: {
                args: [6, 255],
                msg: 'Password must be at least 6 characters',
            },
        },
    },
}, {
    timestamps: true,
    underscored: true,
    tableName: 'users',

    hooks: {
        /**
         * Hash password before creating user
         */
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },

        /**
         * Hash password before updating if changed
         */
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

/**
 * Instance method to compare password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove password from JSON response
 */
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

export default User;