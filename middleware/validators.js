import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation Middleware
 * Uses express-validator for request validation
 */

/**
 * Handles validation results
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value,
            })),
        });
    }

    next();
};

/**
 * User Registration Validation
 */
export const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
        .isAlphanumeric().withMessage('Username can only contain letters and numbers'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    validate,
];

/**
 * User Login Validation
 */
export const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate,
];

/**
 * Create Drop Validation
 */
export const validateCreateDrop = [
    body('name')
        .trim()
        .notEmpty().withMessage('Drop name is required')
        .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),

    body('description')
        .optional()
        .trim(),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('stock')
        .notEmpty().withMessage('Stock is required')
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

    body('initial_stock')
        .notEmpty().withMessage('Initial stock is required')
        .isInt({ min: 0 }).withMessage('Initial stock must be a non-negative integer'),

    body('image_url')
        .optional()
        .trim()
        .isURL().withMessage('Must be a valid URL'),

    body('drop_start_time')
        .optional()
        .isISO8601().withMessage('Must be a valid date'),

    validate,
];

/**
 * Update Drop Validation
 */
export const validateUpdateDrop = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid drop ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),

    body('description')
        .optional()
        .trim(),

    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

    body('image_url')
        .optional()
        .trim()
        .isURL().withMessage('Must be a valid URL'),

    body('drop_start_time')
        .optional()
        .isISO8601().withMessage('Must be a valid date'),

    validate,
];

/**
 * Reserve Item Validation
 */
export const validateReserve = [
    body('dropId')
        .notEmpty().withMessage('Drop ID is required')
        .isInt({ min: 1 }).withMessage('Invalid drop ID'),

    validate,
];

/**
 * Complete Purchase Validation
 */
export const validatePurchase = [
    body('reservationId')
        .notEmpty().withMessage('Reservation ID is required')
        .isInt({ min: 1 }).withMessage('Invalid reservation ID'),

    validate,
];

/**
 * ID Parameter Validation
 */
export const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID parameter'),

    validate,
];

/**
 * Pagination Validation
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    validate,
];

export default {
    validate,
    validateRegister,
    validateLogin,
    validateCreateDrop,
    validateUpdateDrop,
    validateReserve,
    validatePurchase,
    validateIdParam,
    validatePagination,
};