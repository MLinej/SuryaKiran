require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
console.log("Loaded JWT_SECRET:", JWT_SECRET);

const payload = { id: '123', email: 'test@example.com' };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

console.log("Generated Token:", token);

try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Verify OK:", decoded);
} catch (e) {
    console.error("Verify Failed:", e.message);
}

// Now let's try reading the exact logic from middleware
const { requireAuth } = require('./src/middleware/auth');
const authController = require('./src/controllers/authController');

console.log("Middleware JWT_SECRET (check if undefined inside module? Wait, we can't extract it directly, but we can mock req/res)");

const req = { headers: { authorization: `Bearer ${token}` } };
const res = {
    status: (code) => {
        console.log("Res status:", code);
        return { json: (data) => console.log("Res JSON:", data) };
    }
};
const next = () => console.log("Next called! Auth success.");

requireAuth(req, res, next);
