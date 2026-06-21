const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check Endpoint
 *     description: Returns the status of the service and database connection.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: SuryaKiran Backend
 *                 database:
 *                   type: string
 *                   example: connected
 */
router.get('/', async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            service: 'SuryaKiran Backend',
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            service: 'SuryaKiran Backend',
            database: 'disconnected',
            details: error.message
        });
    }
});

module.exports = router;
