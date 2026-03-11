const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get alerts feed
 *     description: Returns a list of all alerts ordered by severity (Critical first, then High, etc.) and created_at conditionally. For simplicity, we order by severity DESC (Assuming text based sort like High > Critical or we can map them in SQL, but for now we will just use created_at descending as standard feed practice).
 *     responses:
 *       200:
 *         description: Array of alerts
 */
router.get('/', async (req, res, next) => {
    try {
        const alerts = await prisma.alerts.findMany({
            orderBy: {
                created_at: 'desc'
            },
            include: {
                Inverter: {
                    include: {
                        Predictions: {
                            orderBy: { created_at: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        res.json(alerts.map((alert) => ({
            id: alert.id,
            severity: alert.severity,
            inverter_id: alert.inverter_id,
            message: alert.message.replace(/^\[ACK\]\s*/, ''),
            status: alert.message.startsWith('[ACK]') ? 'Acknowledged' : 'Active',
            created_at: alert.created_at,
            risk_score: alert.Inverter?.Predictions?.[0]?.risk_score ?? null
        })));
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Acknowledged', 'Dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid alert status.' });
        }

        if (status === 'Dismissed') {
            await prisma.alerts.delete({ where: { id } });
            return res.json({ id, status: 'Dismissed' });
        }

        const alert = await prisma.alerts.findUnique({ where: { id } });
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        const updatedAlert = await prisma.alerts.update({
            where: { id },
            data: {
                message: status === 'Acknowledged'
                    ? (alert.message.startsWith('[ACK]') ? alert.message : `[ACK] ${alert.message}`)
                    : alert.message.replace(/^\[ACK\]\s*/, '')
            }
        });

        res.json(updatedAlert);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
