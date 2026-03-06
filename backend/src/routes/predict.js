const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');
const { validatePredictionInput } = require('../middleware/validation');

/**
 * @swagger
 * /predict:
 *   post:
 *     summary: Submit telemetry data for ML prediction
 *     description: Validates telemetry input, forwards it to the ML service to determine risk, saves the result to the database, and returns the prediction. 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inverter_id
 *               - temperature
 *               - voltage
 *               - current
 *               - power_output
 *             properties:
 *               inverter_id:
 *                 type: string
 *                 example: INV-204
 *               temperature:
 *                 type: number
 *                 example: 78.2
 *               voltage:
 *                 type: number
 *                 example: 412
 *               current:
 *                 type: number
 *                 example: 13.4
 *               power_output:
 *                 type: number
 *                 example: 4.8
 *     responses:
 *       200:
 *         description: Successful prediction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 risk_score:
 *                   type: integer
 *                   example: 88
 *                 risk_level:
 *                   type: string
 *                   example: High
 *                 explanation:
 *                   type: string
 *                   example: Temperature spike combined with power drop indicates possible cooling failure.
 *       400:
 *         description: Validation Error
 */
router.post('/', validatePredictionInput, predictController.predictProbability);

module.exports = router;
