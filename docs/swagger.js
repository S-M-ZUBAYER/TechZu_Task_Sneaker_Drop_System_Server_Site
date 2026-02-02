import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger API Documentation Configuration
 */

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sneaker Drop System API',
            version: '1.0.0',
            description: 'Real-time sneaker drop system with atomic reservations and WebSocket updates',
            contact: {
                name: 'API Support',
                email: 'support@sneakerdrop.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
            {
                url: 'https://api.sneakerdrop.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'User ID',
                        },
                        username: {
                            type: 'string',
                            description: 'Username',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email address',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp',
                        },
                    },
                },
                Drop: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Drop ID',
                        },
                        name: {
                            type: 'string',
                            description: 'Sneaker name',
                        },
                        description: {
                            type: 'string',
                            description: 'Product description',
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Price in USD',
                        },
                        stock: {
                            type: 'integer',
                            description: 'Current available stock',
                        },
                        initial_stock: {
                            type: 'integer',
                            description: 'Initial stock quantity',
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                            description: 'Product image URL',
                        },
                        drop_start_time: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When drop becomes available',
                        },
                    },
                },
                Reservation: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Reservation ID',
                        },
                        user_id: {
                            type: 'integer',
                            description: 'User ID',
                        },
                        drop_id: {
                            type: 'integer',
                            description: 'Drop ID',
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'expired', 'completed'],
                            description: 'Reservation status',
                        },
                        expires_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Expiration timestamp (60 seconds from creation)',
                        },
                    },
                },
                Purchase: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Purchase ID',
                        },
                        user_id: {
                            type: 'integer',
                            description: 'User ID',
                        },
                        drop_id: {
                            type: 'integer',
                            description: 'Drop ID',
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Price at time of purchase',
                        },
                        purchased_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Purchase timestamp',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                    },
                                    message: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error',
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Users',
                description: 'User authentication and profile management',
            },
            {
                name: 'Drops',
                description: 'Sneaker drop management',
            },
            {
                name: 'Reservations',
                description: 'Item reservation with atomic operations',
            },
            {
                name: 'Purchases',
                description: 'Purchase management and history',
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to route files with Swagger comments
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 * @param {Object} app - Express app
 */
export const setupSwagger = (app) => {
    // Swagger UI options
    const swaggerUiOptions = {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Sneaker Drop API Docs',
    };

    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Serve Swagger JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 Swagger documentation available at /api-docs');
};

export default { setupSwagger, swaggerSpec };