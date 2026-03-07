const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const REAL_SECRET = process.env.JWT_SECRET;
const FALLBACK_SECRET = 'supersecretkey123';

async function testTokenSecret() {
    try {
        const testUser = { name: 'SecretTest', email: 'secrettest@test.com', password: 'password123' };
        await axios.post('http://localhost:5000/api/auth/register', testUser).catch(e => { });
        const res = await axios.post('http://localhost:5000/api/auth/login', { email: testUser.email, password: testUser.password });
        const token = res.data.token;
        console.log("Token received.");

        try {
            jwt.verify(token, REAL_SECRET);
            console.log("SUCCESS: It was signed with the REAL_SECRET from .env!");
        } catch (e1) {
            console.log("Failed to verify with REAL_SECRET:", e1.message);
            try {
                jwt.verify(token, FALLBACK_SECRET);
                console.log("SUCCESS: It was signed with the FALLBACK_SECRET ('supersecretkey123')!");
            } catch (e2) {
                console.log("Failed to verify with FALLBACK_SECRET too.");
            }
        }
    } catch (e) {
        console.error("Fatal:", e.message);
    }
}
testTokenSecret();
