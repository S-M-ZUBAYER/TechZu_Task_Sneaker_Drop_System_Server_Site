/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent way
 */

/**
 * Error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;

    // Sequelize Validation Error
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.errors.map(e => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Duplicate Entry';
        errors = err.errors.map(e => ({
            field: e.path,
            message: `${e.path} already exists`,
        }));
    }

    // Sequelize Foreign Key Constraint Error
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        statusCode = 400;
        message = 'Invalid Reference';
        errors = [{
            field: err.index,
            message: 'Referenced record does not exist',
        }];
    }

    // Sequelize Database Error
    if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = 'Database Error';
        if (process.env.NODE_ENV === 'development') {
            errors = [{ message: err.parent.message }];
        }
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid Token';
    }

    // JWT Expired Error
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token Expired';
    }

    // Multer Error (file upload)
    if (err.name === 'MulterError') {
        statusCode = 400;
        message = 'File Upload Error';
        errors = [{ message: err.message }];
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error Class
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default { errorHandler, notFoundHandler, asyncHandler, AppError };