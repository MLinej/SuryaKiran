const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     summary: Get all maintenance tasks
 *     description: Returns a list of all maintenance tasks and faulty inverters.
 *     responses:
 *       200:
 *         description: Array of maintenance entries
 */
router.get('/', async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = status && status !== 'All' ? { status } : {};

        const maintenanceTasks = await prisma.maintenance.findMany({
            where,
            orderBy: {
                scheduled_date: 'desc'
            },
            include: {
                Inverter: true
            }
        });

        res.json(maintenanceTasks);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     summary: Add a new maintenance task
 *     description: Creates a new maintenance log for an inverter.
 */
router.post('/', async (req, res, next) => {
    try {
        const { inverter_id, issue, scheduled_date } = req.body;

        // Ensure inverter exists first to prevent foreign key constraint violations
        await prisma.inverters.upsert({
            where: { id: inverter_id },
            update: { last_updated: new Date() },
            create: { id: inverter_id, block: 'A', status: 'Healthy' }
        });

        const newTask = await prisma.maintenance.create({
            data: {
                inverter_id,
                issue,
                status: 'Pending',
                scheduled_date: scheduled_date ? new Date(scheduled_date) : new Date()
            }
        });

        res.status(201).json(newTask);
    } catch (error) {
        next(error);
    }
});


/**
 * @swagger
 * /api/maintenance/{id}:
 *   put:
 *     summary: Update maintenance status
 *     description: Update the status of an existing maintenance task.
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use Pending, In Progress, or Resolved.' });
        }

        const updatedTask = await prisma.maintenance.update({
            where: { id },
            data: {
                status
            },
            include: {
                Inverter: true
            }
        });

        res.json(updatedTask);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
