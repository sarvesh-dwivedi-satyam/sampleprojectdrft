require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdmin() {
    const name = String(process.env.ADMIN_NAME || '').trim();
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || '');
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128) {
        throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of 12 to 128 characters for this command.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
        `INSERT INTO customers (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [name, email, passwordHash]
    );
    console.log(`Administrator account configured for ${email}.`);
}

createAdmin()
    .catch((error) => {
        console.error('Administrator setup failed:', error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
