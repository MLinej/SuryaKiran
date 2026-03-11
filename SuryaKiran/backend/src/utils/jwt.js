function normalizeSecret(value) {
    if (!value) return '';
    return String(value).trim().replace(/^['\"]|['\"]$/g, '');
}

function getJwtSecret() {
    return normalizeSecret(process.env.JWT_SECRET) || 'supersecretkey123';
}

module.exports = { getJwtSecret };
