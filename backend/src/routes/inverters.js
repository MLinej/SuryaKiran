const express = require('express');
const router = express.Router();
const inverterController = require('../controllers/inverterController');

/**
 * @swagger
 * /api/inverters:
 *   get:
 *     summary: Get all inverters
 *     description: Returns all inverters along with their latest risk score and level.
 *     responses:
 *       200:
 *         description: A list of inverters
 */
router.get('/', inverterController.getInverters);

/**
 * @swagger
 * /api/inverters/{id}:
 *   get:
 *     summary: Get inverter details
 *     description: Returns specifics of an inverter combined with its latest telemetry reading and prediction.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the inverter to retrieve
 *     responses:
 *       200:
 *         description: Inverter details
 *       404:
 *         description: Inverter not found
 */
router.get('/:id', inverterController.getInverterById);

/**
 * @swagger
 * /api/inverters:
 *   post:
 *     summary: Add or update an inverter
 *     description: Creates a new inverter if it does not exist.
 */
router.post('/', inverterController.createInverter);

module.exports = router;
