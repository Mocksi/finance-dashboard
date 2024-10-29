// server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, '../build')));

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Basic auth middleware
const authenticateUser = async (req, res, next) => {
    console.log('Auth headers received:', req.headers);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No auth header found');
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        console.log('Base64 credentials:', base64Credentials);
        const credentials = Buffer.from(base64Credentials, 'base64').toString();
        console.log('Decoded credentials:', credentials);
        const [email, password] = credentials.split(':');
        
        // For development, accept test credentials
        if (email === 'admin@company.com' && password === 'testpass123') {
            console.log('Authentication successful');
            next();
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add this before your routes
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// At the top of your routes, add a test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'API is working' });
});

// Add logging to your existing routes
app.get('/api/dashboard-data', authenticateUser, async (req, res) => {
    console.log('Dashboard endpoint hit');
    try {
        // Monthly revenue
        const monthlyRevenue = await pool.query(`
            SELECT 
                date_trunc('month', date) as month,
                SUM(credit - debit) as revenue
            FROM transactions
            GROUP BY date_trunc('month', date)
            ORDER BY month DESC
            LIMIT 6
        `);

        // Department revenue
        const departmentRevenue = await pool.query(`
            SELECT 
                department,
                SUM(credit - debit) as revenue
            FROM transactions
            WHERE department IS NOT NULL
            GROUP BY department
        `);

        // Category expenses
        const categoryExpenses = await pool.query(`
            SELECT 
                category,
                SUM(debit) as total
            FROM transactions
            WHERE debit > 0
            GROUP BY category
        `);

        res.json({
            monthlyRevenue: monthlyRevenue.rows,
            departmentRevenue: departmentRevenue.rows,
            categoryExpenses: categoryExpenses.rows
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.get('/api/transactions', authenticateUser, async (req, res) => {
    console.log('Transactions endpoint hit');
    try {
        const result = await pool.query(`
            SELECT * FROM transactions 
            ORDER BY date DESC
            LIMIT 100
        `);
        res.json({ transactions: result.rows });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Serve React app
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../build/index.html'));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`Dashboard endpoint: http://localhost:${PORT}/api/dashboard-data`);
    console.log(`Transactions endpoint: http://localhost:${PORT}/api/transactions`);
});