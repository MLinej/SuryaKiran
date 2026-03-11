const axios = require('axios');

async function testForecastRoute() {
    try {
        // Register a temporary test user
        const testUser = {
            name: "Test User",
            email: `test_forecast_${Date.now()}@test.com`,
            password: "password123"
        };
        await axios.post('http://localhost:5000/api/auth/register', testUser);

        // Login to get token
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: testUser.email,
            password: testUser.password
        });
        const token = res.data.token;

        // Test the forecast endpoint
        console.log("Fetching forecast for INV-02...");
        const forecastRes = await axios.get('http://localhost:5000/api/forecast/all?inverter_id=INV-02', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", forecastRes.status);
        console.log("Data keys:", Object.keys(forecastRes.data));
        console.log("Power array length:", forecastRes.data.power ? forecastRes.data.power.length : 'missing');
        console.log("Risk array length:", forecastRes.data.risk ? forecastRes.data.risk.length : 'missing');
    } catch (error) {
        if (error.response) {
            console.error(`ERROR: ${error.response.status} -`, error.response.data);
        } else {
            console.error("NETWORK ERROR:", error.message);
        }
    }
}

testForecastRoute();
