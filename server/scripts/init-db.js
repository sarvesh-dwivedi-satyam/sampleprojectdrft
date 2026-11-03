require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../config/database');

async function initialize() {
    const schema = await fs.readFile(path.resolve(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized.');
}

initialize()
    .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
