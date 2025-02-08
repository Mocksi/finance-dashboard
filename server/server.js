// server/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const { securityHeaders, corsOptions } = require('./middleware/security');
const transactionsRouter = require('./routes/transactions');
const dashboardRouter = require('./routes/dashboard');
const uploadRouter = require('./routes/upload');
const accountRouter = require('./routes/account');

const app = express();

// Apply security headers middleware
app.use(securityHeaders);

// Apply CORS configuration
app.use(cors(corsOptions));

app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// PostgreSQL connection pool
console.log('Attempting database connection...');
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
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

// Basic auth middleware
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
            .toString()
            .split(':');
        
        if (email === 'admin@company.com' && password === 'testpass123') {
            next();
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Enhanced API Routes
app.get('/api/dashboard-data', authenticateUser, async (req, res) => {
    try {
        // Monthly metrics (revenue, expenses, profit)
        const monthlyMetrics = await pool.query(`
            SELECT 
                date_trunc('month', date) as month,
                SUM(credit) as revenue,
                SUM(debit) as expenses,
                SUM(credit - debit) as profit
            FROM transactions
            GROUP BY date_trunc('month', date)
            ORDER BY month DESC
            LIMIT 6
        `);

        // Department performance
        const departmentRevenue = await pool.query(`
            SELECT 
                department,
                SUM(credit) as revenue,
                COUNT(*) as transaction_count,
                AVG(credit) as average_deal_size
            FROM transactions
            WHERE credit > 0
            GROUP BY department
            HAVING SUM(credit) > 0
            ORDER BY revenue DESC
        `);

        // Expense categories
        const categoryExpenses = await pool.query(`
            SELECT 
                category,
                SUM(debit) as total,
                COUNT(*) as transaction_count,
                AVG(debit) as average_expense
            FROM transactions
            WHERE debit > 0
            GROUP BY category
            HAVING SUM(debit) > 0
            ORDER BY total DESC
        `);

        // Monthly comparisons and KPIs
        const kpis = await pool.query(`
            WITH monthly_totals AS (
                SELECT 
                    date_trunc('month', date) as month,
                    SUM(credit) as revenue,
                    SUM(debit) as expenses
                FROM transactions
                WHERE date >= date_trunc('month', CURRENT_DATE - interval '1 month')
                GROUP BY date_trunc('month', date)
            )
            SELECT 
                COALESCE((SELECT revenue FROM monthly_totals 
                    WHERE month = date_trunc('month', CURRENT_DATE)), 0) as current_month_revenue,
                COALESCE((SELECT expenses FROM monthly_totals 
                    WHERE month = date_trunc('month', CURRENT_DATE)), 0) as current_month_expenses,
                COALESCE((SELECT revenue FROM monthly_totals 
                    WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0) as last_month_revenue,
                COUNT(DISTINCT CASE WHEN credit > 0 THEN department END) as active_departments
            FROM transactions;
        `);

        res.json({
            monthlyMetrics: monthlyMetrics.rows,
            departmentRevenue: departmentRevenue.rows,
            categoryExpenses: categoryExpenses.rows,
            kpis: kpis.rows[0]
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.use('/api/transactions', transactionsRouter);

// Mount the dashboard router at /api/dashboard
app.use('/api/dashboard', dashboardRouter);
app.use('/api/invoices', require('./routes/invoices'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Use upload router
app.use('/api/upload', uploadRouter);

// Register the account routes
app.use('/api/account', accountRouter);

// Serve React app - this should be after all API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Add a catch-all route handler for debugging
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});