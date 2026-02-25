const http = require('http');

const loginData = JSON.stringify({ email: 'saed.jaber@psinv.net', password: 'password123' });

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : '';
    console.log("Login Status:", res.statusCode);
    console.log("Cookie received:", cookie);

    if (!cookie) return;

    // Test Org Fetch
    http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/org/me',
        method: 'GET',
        headers: { 'Cookie': cookie }
    }, (res2) => {
        let body = '';
        res2.on('data', d => body += d);
        res2.on('end', () => console.log('/api/org/me Status:', res2.statusCode, 'Body length:', body.length));
    }).end();

    // Test Analytics Fetch
    http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/analytics',
        method: 'GET',
        headers: { 'Cookie': cookie }
    }, (res3) => {
        let body = '';
        res3.on('data', d => body += d);
        res3.on('end', () => console.log('/api/analytics Status:', res3.statusCode, 'Body length:', body.length));
    }).end();

});

req.write(loginData);
req.end();
