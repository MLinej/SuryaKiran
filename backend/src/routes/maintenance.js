const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

router.get('/', async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = status && status !== 'All' ? { status } : {};

        const maintenanceTasks = await prisma.maintenance.findMany({
            where,
            orderBy: {
                scheduled_date: 'desc',
            },
            include: {
                Inverter: true,
            },
        });

        res.json(maintenanceTasks);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { inverter_id, issue, details, scheduled_date } = req.body;

        await prisma.inverters.upsert({
            where: { id: inverter_id },
            update: { last_updated: new Date() },
            create: { id: inverter_id, block: 'A', status: 'Healthy' },
        });

        const newTask = await prisma.maintenance.create({
            data: {
                inverter_id,
                issue,
                details: details || null,
                status: 'Pending',
                scheduled_date: scheduled_date ? new Date(scheduled_date) : new Date(),
            },
        });

        res.status(201).json(newTask);
    } catch (error) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, resolution_notes } = req.body;

        if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Use Pending, In Progress, or Resolved.' });
        }

        const updatedTask = await prisma.maintenance.update({
            where: { id },
            data: {
                status,
                resolution_notes: resolution_notes || null,
                resolved_at: status === 'Resolved' ? new Date() : null,
            },
            include: {
                Inverter: true,
            },
        });

        res.json(updatedTask);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
