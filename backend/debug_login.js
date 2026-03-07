const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugLogin() {
    try {
        const testUser = {
            name: "Test User",
            email: `test${Date.now()}@test.com`,
            password: "password123"
        };

        console.log("1. Registering user...");
        await axios.post('http://localhost:5000/api/auth/register', testUser);

        console.log("2. Logging in...");
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: testUser.email,
            password: testUser.password
        });

        const token = res.data.token;
        console.log("   Token received:", token.substring(0, 15) + '...');

        console.log("3. Accessing protected route...");
        const protectedRes = await axios.get('http://localhost:5000/api/inverters', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("   SUCCESS! Backend accepted the token! Status:", protectedRes.status);
    } catch (error) {
        if (error.response) {
            console.error(`ERROR: ${error.response.status} -`, error.response.data);
        } else {
            console.error("NETWORK ERROR:", error.message);
        }
    }
}

debugLogin();
