const express = require('express');
const cors = require('cors');
const app = express();

// Security headers middleware
app.use((req, res, next) => {
    // Cache control
    res.set('Cache-Control', 'no-store');

    // Security headers
    res.set('Content-Security-Policy', "default-src 'none'; connect-src 'self'; font-src https://fonts.gstatic.com; img-src *; script-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content");
    res.set('Cross-Origin-Embedder-Policy', 'credentialless');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Resource-Policy', 'same-site');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Strict-Transport-Security', 'max-age=2592000; preload');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');
    res.set('X-XSS-Protection', '1');
    next();
});

// Update CORS configuration
app.use(cors({
    origin: ['https://finance-dashboard-tfn6.onrender.com', 'https://financy-luln.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Security-Policy', 'Cross-Origin-Embedder-Policy']
}));

app.use(express.json());

// API routes
app.use('/api/account', require('./routes/account'));
// ... other routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Catch-all route for API endpoints
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files only for non-API routes
app.use(express.static('public'));

module.exports = app;