const { spawn } = require('child_process');
const axios = require('axios');

async function run() {
    const serverProcess = spawn('node', ['src/server.js'], { cwd: 'e:\\HackaMind\\SuryaKiran\\backend' });

    serverProcess.stdout.on('data', data => console.log('SERVER OUT:', data.toString().trim()));
    serverProcess.stderr.on('data', data => console.error('SERVER ERR:', data.toString().trim()));

    // Wait 2 seconds for server to start
    await new Promise(r => setTimeout(r, 2000));

    try {
        const testUser = { name: 'LiveTest', email: 'livetest@test.com', password: 'password123' };
        await axios.post('http://localhost:5000/api/auth/register', testUser).catch(e => { });
        const res = await axios.post('http://localhost:5000/api/auth/login', { email: testUser.email, password: testUser.password });
        const token = res.data.token;
        console.log("Logged in. Token:", token.substring(0, 15) + "...");

        await axios.get('http://localhost:5000/api/inverters', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS! The route didn't return 401.");
    } catch (e) {
        console.log("AXIOS CAUGHT ERROR:", e.response ? e.response.status : e.message);
    } finally {
        serverProcess.kill();
        process.exit();
    }
}
run();
