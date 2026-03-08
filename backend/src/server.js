const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');

// Routes Import
const healthRoutes = require('./routes/health');
const predictRoutes = require('./routes/predict');
const invertersRoutes = require('./routes/inverters');
const alertsRoutes = require('./routes/alerts');
const authRoutes = require('./routes/auth');
const maintenanceRoutes = require('./routes/maintenance');
const reportsRoutes = require('./routes/reports');
const energyRoutes = require('./routes/energy');
const analyticsRoutes = require('./routes/analytics');
const copilotRoutes = require('./routes/copilot');
const forecastRoutes = require('./routes/forecast');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Swagger Options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SuryaKiran API',
            version: '1.0.0',
            description: 'API for SuryaKiran Solar Monitoring Platform',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local development server'
            }
        ]
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/health', healthRoutes);

// Protected routes
app.use('/predict', requireAuth, predictRoutes);
app.use('/api/inverters', requireAuth, invertersRoutes);
app.use('/api/alerts', requireAuth, alertsRoutes);
app.use('/api/maintenance', requireAuth, maintenanceRoutes);
app.use('/api/reports', requireAuth, reportsRoutes);
app.use('/api/energy', requireAuth, energyRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/copilot', requireAuth, copilotRoutes);
app.use('/api/chat', requireAuth, copilotRoutes); // backward compatibility
app.use('/api/forecast', requireAuth, forecastRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
