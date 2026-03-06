require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorHandler');

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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/health', healthRoutes);
app.use('/predict', predictRoutes);
app.use('/api/inverters', invertersRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
