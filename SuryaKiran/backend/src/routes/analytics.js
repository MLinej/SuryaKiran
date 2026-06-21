const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

router.get('/', async (req, res, next) => {
    try {
        const days = Number(req.query.days || 7);
        const since = new Date();
        since.setDate(since.getDate() - days);

        const telemetry = await prisma.telemetry.findMany({
            where: { timestamp: { gte: since } },
            orderBy: { timestamp: 'asc' }
        });

        const grouped = telemetry.reduce((acc, row) => {
            const dateKey = row.timestamp.toISOString().slice(0, 10);
            if (!acc[dateKey]) {
                acc[dateKey] = { date: dateKey, power: 0, pv1: 0, count: 0 };
            }
            acc[dateKey].power += row.power_kw;
            acc[dateKey].pv1 += row.pv1_power_kw;
            acc[dateKey].count += 1;
            return acc;
        }, {});

        const performanceRatio = Object.values(grouped).map((g) => {
            const avgPower = g.power / g.count;
            const avgPv1 = g.pv1 / g.count;
            const actual = avgPv1 > 0 ? Number(((avgPower / avgPv1) * 100).toFixed(2)) : 0;
            const predicted = Number(Math.min(100, actual + 2).toFixed(2));
            return { date: g.date, actual, predicted };
        });

        const inverters = await prisma.inverters.findMany({
            include: {
                Predictions: { orderBy: { created_at: 'desc' }, take: 1 }
            }
        });

        const byBlock = {};
        inverters.forEach((inv) => {
            const block = inv.block || 'Unknown';
            if (!byBlock[block]) byBlock[block] = 0;
            const riskScore = inv.Predictions?.[0]?.risk_score || 0;
            byBlock[block] += riskScore >= 70 ? 1 : 0;
        });

        const energyByBlock = Object.entries(byBlock).map(([name, count]) => ({
            name,
            value: Number((count * 0.8).toFixed(2))
        }));

        const totalEstimate = `${energyByBlock.reduce((sum, b) => sum + b.value, 0).toFixed(1)} MWh`;

        res.json({
            performanceRatio,
            energyLoss: {
                totalEstimate,
                byBlock: energyByBlock
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
