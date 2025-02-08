const express = require('express');
const cors = require('cors');
const { securityHeaders, corsOptions } = require('./middleware/security');
const app = express();

// Apply security headers middleware
app.use(securityHeaders);

// Apply CORS configuration
app.use(cors(corsOptions));

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