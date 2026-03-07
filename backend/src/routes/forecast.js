const express = require('express');
const axios = require('axios');
const prisma = require('../config/database');

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

function countCsvRows(csvContent = '') {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return 0;
    return lines.length - 1;
}

function extractInverterIds(csvContent = '') {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const inverterIdx = headers.indexOf('inverter_id');
    if (inverterIdx < 0) return [];

    const ids = new Set();
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const id = (cols[inverterIdx] || '').trim();
        if (id) ids.add(id);
    }
    return [...ids];
}

async function ensureInvertersExist(inverterIds = []) {
    await Promise.all(inverterIds.map((id) =>
        prisma.inverters.upsert({
            where: { id },
            update: { last_updated: new Date() },
            create: { id, block: 'A', status: 'Healthy' },
        })
    ));
}

function normalizeAllResponse(raw = {}, inverterId = null, source = 'ml-service') {
    const forecast = Array.isArray(raw.forecast) ? raw.forecast : [];
    const power = forecast.map((p) => Number(p.predicted_power_kw || 0));
    const risk = forecast.map((p) => Number(p.risk_score || 0));
    const timestamps = forecast.map((p) => p.timestamp || null);

    return {
        inverter_id: raw.inverter_id || inverterId,
        total_minutes: raw.total_minutes || forecast.length,
        power,
        risk,
        timestamps,
        forecast,
        source,
    };
}

async function saveForecastPoints(uploadId, inverterId, source = 'csv-trained') {
    const response = await axios.get(`${ML_SERVICE_URL}/forecast/all`, {
        params: { inverter_id: inverterId },
        timeout: 30000,
    });

    const payload = normalizeAllResponse(response.data, inverterId, source);
    const points = payload.forecast.map((row) => ({
        upload_id: uploadId,
        inverter_id: inverterId,
        minute_offset: Number(row.minute || 0),
        timestamp_iso: String(row.timestamp || ''),
        predicted_power_kw: Number(row.predicted_power_kw || 0),
        risk_score: Number(row.risk_score || 0),
        source,
    })).filter((row) => row.minute_offset > 0);

    await prisma.forecastPoint.deleteMany({ where: { inverter_id: inverterId } });

    if (points.length > 0) {
        await prisma.forecastPoint.createMany({ data: points });
    }

    return payload;
}

async function getDbForecastAll(inverterId) {
    const points = await prisma.forecastPoint.findMany({
        where: { inverter_id: inverterId },
        orderBy: { minute_offset: 'asc' },
    });

    if (!points.length) return null;

    const forecast = points.map((p) => ({
        minute: p.minute_offset,
        timestamp: p.timestamp_iso,
        predicted_power_kw: p.predicted_power_kw,
        risk_score: p.risk_score,
    }));

    return normalizeAllResponse({ inverter_id: inverterId, forecast }, inverterId, points[0].source || 'db-cache');
}

router.post('/upload', async (req, res) => {
    try {
        const csvContent = req.body?.file_content;
        if (!csvContent || typeof csvContent !== 'string') {
            return res.status(400).json({ error: 'file_content (CSV string) is required' });
        }

        const inverterIdsFromCsv = extractInverterIds(csvContent);
        await ensureInvertersExist(inverterIdsFromCsv);

        const upload = await prisma.forecastUpload.create({
            data: {
                user_id: req.user.id,
                inverter_id: inverterIdsFromCsv[0] || null,
                csv_content: csvContent,
                rows_count: countCsvRows(csvContent),
                source: 'csv',
            },
        });

        const mlResponse = await axios.post(
            `${ML_SERVICE_URL}/forecast/upload`,
            { file_content: csvContent },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        const modelInverterIds = Object.keys(mlResponse.data?.inverters || {});
        const inverterIds = modelInverterIds.length ? modelInverterIds : inverterIdsFromCsv;

        const persisted = {};
        for (const inverterId of inverterIds) {
            persisted[inverterId] = await saveForecastPoints(upload.id, inverterId, 'csv-trained');
        }

        return res.json({
            ...mlResponse.data,
            upload_id: upload.id,
            stored_rows: upload.rows_count,
            persisted_inverters: Object.keys(persisted),
        });
    } catch (error) {
        console.error('[Forecast] Upload error:', error.message);
        return res.status(error.response?.status || 500).json(error.response?.data || { error: 'ML service unavailable' });
    }
});

router.get('/next', async (req, res) => {
    const { inverter_id: inverterId } = req.query;
    const currentMinute = Number(req.query.current_minute || 0);

    if (!inverterId) {
        return res.status(400).json({ error: 'inverter_id is required' });
    }

    try {
        const response = await axios.get(`${ML_SERVICE_URL}/forecast/next`, {
            params: { inverter_id: inverterId, current_minute: currentMinute },
            timeout: 15000,
        });

        return res.json({ ...response.data, source: 'ml-service' });
    } catch (_err) {
        const all = await getDbForecastAll(inverterId);
        if (!all) {
            return res.status(404).json({ error: `No forecast found for ${inverterId}` });
        }

        const total = all.forecast.length;
        const minuteBase = ((currentMinute % total) + total) % total;
        const forecast = [1, 2, 3].map((step) => {
            const idx = (minuteBase + step - 1) % total;
            return {
                minute: currentMinute + step,
                timestamp: all.forecast[idx].timestamp,
                predicted_power_kw: Number(all.forecast[idx].predicted_power_kw || 0),
                risk_score: Number(all.forecast[idx].risk_score || 0),
            };
        });

        return res.json({
            inverter_id: inverterId,
            current_minute: currentMinute,
            forecast,
            source: 'db-cache',
        });
    }
});

router.get('/all', async (req, res) => {
    const { inverter_id: inverterId } = req.query;
    if (!inverterId) {
        return res.status(400).json({ error: 'inverter_id is required' });
    }

    try {
        const response = await axios.get(`${ML_SERVICE_URL}/forecast/all`, {
            params: { inverter_id: inverterId },
            timeout: 20000,
        });

        const normalized = normalizeAllResponse(response.data, inverterId, 'ml-service');

        await ensureInvertersExist([inverterId]);

        if (normalized.forecast.length > 0) {
            await prisma.forecastPoint.deleteMany({ where: { inverter_id: inverterId } });
            await prisma.forecastPoint.createMany({
                data: normalized.forecast.map((row) => ({
                    inverter_id: inverterId,
                    minute_offset: Number(row.minute || 0),
                    timestamp_iso: String(row.timestamp || ''),
                    predicted_power_kw: Number(row.predicted_power_kw || 0),
                    risk_score: Number(row.risk_score || 0),
                    source: 'pretrained',
                })).filter((row) => row.minute_offset > 0),
            });
        }

        return res.json(normalized);
    } catch (_error) {
        const cached = await getDbForecastAll(inverterId);
        if (!cached) {
            return res.status(404).json({ error: `No forecast found for ${inverterId}` });
        }
        return res.json(cached);
    }
});

module.exports = router;
