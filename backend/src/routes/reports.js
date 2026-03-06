const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all available reports
 *     description: Returns a list of generated reports for download.
 *     responses:
 *       200:
 *         description: Array of reports
 */
router.get('/', async (req, res, next) => {
    try {
        const { type } = req.query;
        const reports = await prisma.reports.findMany({
            where: type && type !== 'All' ? { type } : {},
            orderBy: {
                date: 'desc'
            }
        });

        res.json(reports);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { title, type } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: 'title and type are required' });
        }

        const newReport = await prisma.reports.create({
            data: {
                title,
                type,
                size: `${(Math.random() * 2 + 1).toFixed(1)} MB`
            }
        });

        res.status(201).json(newReport);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
