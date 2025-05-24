const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DERN Support API',
            version: '1.0.0',
            description: 'Computer repair backend API with Firebase',
        },
        servers: [{ url: 'http://localhost:4000' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        uid: { type: 'string', example: 'U123' },
                        email: { type: 'string', example: 'user@example.com' },
                        username: { type: 'string', example: 'john_doe' },
                        isAdmin: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time', example: '2025-05-20T15:30:00.000Z' }
                    }
                },
                RepairRequest: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'REQ123' },
                        uid: { type: 'string', example: 'U123' },
                        issueName: { type: 'string', example: 'Screen not working' },
                        problemType: { type: 'string', example: 'hardware' },
                        isOther: { type: 'boolean', example: false },
                        description: { type: 'string', example: 'Other type issue description' },
                        status: { type: 'string', example: 'PENDING' },
                        price: { type: 'number', example: 250 },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                                example: 'https://storage.googleapis.com/your-bucket/requests/U123/filename.jpg'
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time', example: '2025-05-20T15:30:00.000Z' },
                        adminMessage: { type: 'string', example: 'Please check charger too.' }
                    }
                },
                Feedback: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'FB123' },
                        uid: { type: 'string', example: 'U123' },
                        requestId: { type: 'string', example: 'REQ123' },
                        rating: { type: 'integer', example: 5 },
                        comment: { type: 'string', example: 'Great service, thanks!' },
                        createdAt: { type: 'string', format: 'date-time', example: '2025-05-20T17:00:00.000Z' }
                    }
                },
                DeleteRequestBody: {
                    type: 'object',
                    properties: {
                        uid: {
                            type: 'string',
                            example: 'U123'
                        }
                    },
                    required: ['uid']
                },
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerUi, swaggerSpec };
