const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/dashboard-data', auth, async (req, res) => {
  try {
    const monthlyMetricsQuery = `
      SELECT 
        DATE_TRUNC('month', date) as month,
        COALESCE(SUM(credit), 0) as revenue,
        COALESCE(SUM(debit), 0) as expenses
      FROM transactions
      WHERE date >= NOW() - INTERVAL '11 months'
        AND date <= NOW() + INTERVAL '1 month'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC`;

    const departmentMetricsQuery = `
      SELECT 
        department,
        COALESCE(SUM(credit), 0) as revenue
      FROM transactions
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY department
      ORDER BY revenue DESC`;

    const expenseCategoriesQuery = `
      SELECT 
        category,
        COALESCE(SUM(debit), 0) as amount
      FROM transactions
      WHERE date >= NOW() - INTERVAL '12 months' AND debit > 0
      GROUP BY category
      ORDER BY amount DESC`;

    const [monthlyResult, departmentResult, categoryResult] = await Promise.all([
      pool.query(monthlyMetricsQuery),
      pool.query(departmentMetricsQuery),
      pool.query(expenseCategoriesQuery)
    ]);

    res.json({
      monthlyMetrics: monthlyResult.rows,
      departmentMetrics: departmentResult.rows,
      expenseCategories: categoryResult.rows,
      invoiceProjections: []
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 