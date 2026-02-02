import sequelize from '../config/database.js';
import User from './User.js';
import Drop from './Drop.js';
import Reservation from './Reservation.js';
import Purchase from './Purchase.js';

/**
 * Model Associations
 * Define relationships between models
 */

// User -> Reservations (One to Many)
User.hasMany(Reservation, {
    foreignKey: 'user_id',
    as: 'reservations',
    onDelete: 'CASCADE',
});
Reservation.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

// User -> Purchases (One to Many)
User.hasMany(Purchase, {
    foreignKey: 'user_id',
    as: 'purchases',
    onDelete: 'CASCADE',
});
Purchase.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

// Drop -> Reservations (One to Many)
Drop.hasMany(Reservation, {
    foreignKey: 'drop_id',
    as: 'reservations',
    onDelete: 'CASCADE',
});
Reservation.belongsTo(Drop, {
    foreignKey: 'drop_id',
    as: 'drop',
});

// Drop -> Purchases (One to Many)
Drop.hasMany(Purchase, {
    foreignKey: 'drop_id',
    as: 'purchases',
    onDelete: 'CASCADE',
});
Purchase.belongsTo(Drop, {
    foreignKey: 'drop_id',
    as: 'drop',
});

/**
 * Export all models and sequelize instance
 */
export {
    sequelize,
    User,
    Drop,
    Reservation,
    Purchase,
};

export default {
    sequelize,
    User,
    Drop,
    Reservation,
    Purchase,
};