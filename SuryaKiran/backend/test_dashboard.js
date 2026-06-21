const axios = require('axios');
async function testDashboard() {
    try {
        const testUser = { name: 'DashTest', email: 'dashtest@test.com', password: 'password123' };
        await axios.post('http://localhost:5000/api/auth/register', testUser).catch(e => { });
        const res = await axios.post('http://localhost:5000/api/auth/login', { email: testUser.email, password: testUser.password });
        const token = res.data.token;
        console.log('Login OK. Token length:', token.length);

        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
            '/api/inverters',
            '/api/alerts',
            '/api/reports',
            '/api/forecast/all?inverter_id=INV-01',
            '/api/forecast/next?inverter_id=INV-01',
            '/api/analytics/risk-trends',
            '/api/maintenance/schedule?inverter_id=INV-01'
        ];

        for (const ep of endpoints) {
            try {
                const r = await axios.get('http://localhost:5000' + ep, { headers });
                console.log(ep, '-> OK', r.status);
            } catch (err) {
                console.error(ep, '-> ERROR', err.response ? err.response.status : err.message);
            }
        }
    } catch (e) {
        console.error('Fatal:', e.message);
    }
}
testDashboard();
