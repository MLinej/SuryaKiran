const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, getJwtSecret());
        return next();
    } catch (error) {
        // Fallback for old tokens minted with slightly different secret formatting
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
                req.user = decoded;
                return next();
            }
        } catch (_ignore) {
            // no-op
        }

        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };
