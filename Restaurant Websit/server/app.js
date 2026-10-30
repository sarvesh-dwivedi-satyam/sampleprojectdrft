const path = require('node:path');
const express = require('express');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/database');
const api = require('./routes/api');

const app = express();
const PgSession = connectPgSimple(session);
const production = process.env.NODE_ENV === 'production';
const origin = new URL(process.env.APP_ORIGIN || `http://localhost:${process.env.PORT || 3000}`).origin;

app.disable('x-powered-by');
app.set('trust proxy', production ? 1 : false);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.razorpay.com'],
            frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: production ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(express.json({
    limit: '32kb',
    verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); }
}));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(session({
    name: 'midnight.sid',
    store: new PgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.SESSION_COOKIE_SECURE === 'true' || production,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));
app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false
}));
app.use('/api', (req, res, next) => {
    if (!req.path.startsWith('/payments/webhook') && req.method !== 'GET' && req.method !== 'HEAD') {
        const requestOrigin = req.get('origin');
        if (requestOrigin && requestOrigin !== origin) {
            return res.status(403).json({ error: 'Request origin is not allowed.' });
        }
    }
    next();
});
app.use('/api', api);

app.get('/api/health', async (_req, res, next) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch (error) {
        next(error);
    }
});

app.get('/admin/login.html', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'admin', 'login.html'));
});
app.use(['/profile.html', '/orders.html', '/checkout.html'], (req, res, next) => {
    if (req.session.customer) return next();
    res.redirect('/login.html');
});
app.use('/admin', (req, res, next) => {
    if (['/login.html', '/admin.js', '/admin.css'].includes(req.path)) return next();
    if (req.session.customer?.role === 'admin') return next();
    res.redirect('/admin/login.html');
});
app.use('/admin', express.static(path.resolve(__dirname, '..', 'admin'), { index: 'index.html' }));
app.use(['/server', '/database', '/node_modules'], (_req, res) => res.status(404).send('Page not found.'));
app.use(['/tests', '/package.json', '/README.md', '/.env.example', '/.gitignore'], (_req, res) => res.status(404).send('Page not found.'));
app.use(express.static(path.resolve(__dirname, '..'), {
    extensions: ['html'],
    index: 'index.html',
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
}));

app.use((_req, res) => res.status(404).send('Page not found.'));
app.use((error, _req, res, _next) => {
    console.error('Request failed:', error);
    if (res.headersSent) return;
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
    res.status(status).json({
        error: status === 500 ? 'The request could not be completed. Please try again later.' : error.message
    });
});

module.exports = app;
