require('dotenv').config();
const express = require('express');
const { requireAuth } = require('./src/middleware/auth');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const app = express();

app.use(express.json());

app.post('/test-login', (req, res) => {
    // Generate a token exactly like authController does
    const token = jwt.sign(
        { id: '123', email: 'test@example.com', role: 'operator', name: 'Test' },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
    res.json({ token });
});

app.get('/test-protected', requireAuth, (req, res) => {
    res.json({ success: true, user: req.user });
});

const server = app.listen(5005, async () => {
    console.log("Test server running on 5005");
    const axios = require('axios');
    try {
        const loginRes = await axios.post('http://localhost:5005/test-login', {});
        const token = loginRes.data.token;
        console.log("Received token:", token.substring(0, 15) + "...");

        const protRes = await axios.get('http://localhost:5005/test-protected', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Protected route OK:", protRes.data);
    } catch (e) {
        console.error("Protected route FAILED:", e.response ? e.response.status : e.message);
        if (e.response) console.error("Data:", e.response.data);
    } finally {
        server.close();
    }
});
