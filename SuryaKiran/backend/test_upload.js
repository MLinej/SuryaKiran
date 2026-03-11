const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    // Login first
    const testUser = { name: 'UploadTest', email: 'uploadtest@test.com', password: 'password123' };
    await axios.post('http://localhost:5000/api/auth/register', testUser).catch(() => { });
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', { email: testUser.email, password: testUser.password });
    const token = loginRes.data.token;
    console.log("Login OK");

    // Read the CSV, but only send first 500 rows to test quickly
    const csvPath = path.resolve(__dirname, '..', 'upload_ready_csv', 'Copy of 80-1F-12-0F-AC-12_upload_ready.csv');
    const fullContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fullContent.split('\n');
    const testContent = lines.slice(0, 501).join('\n');  // header + 500 data rows

    console.log(`Sending ${testContent.length} bytes (${lines.length} total lines, sending 500)...`);

    try {
        const res = await axios.post('http://localhost:5000/api/forecast/upload',
            { file_content: testContent },
            {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );
        console.log("SUCCESS!", JSON.stringify(res.data).substring(0, 200));
    } catch (e) {
        console.error("FAILED:", e.response ? `${e.response.status} - ${JSON.stringify(e.response.data)}` : e.message);
    }
}
testUpload();
