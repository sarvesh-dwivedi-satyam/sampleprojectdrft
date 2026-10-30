require('dotenv').config();
if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
}
if (process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'true') {
    throw new Error('Set SESSION_COOKIE_SECURE=true when NODE_ENV=production.');
}

const app = require('./app');
const pool = require('./config/database');
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
    console.log(`Midnight Bistro listening on port ${port}`);
});

async function shutdown(signal) {
    console.log(`${signal} received; closing server.`);
    server.close(async (error) => {
        await pool.end();
        if (error) {
            console.error('Server shutdown failed:', error);
            process.exitCode = 1;
        }
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
