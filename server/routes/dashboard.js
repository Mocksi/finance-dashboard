const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard-data', auth, async (req, res) => {
  try {
    // Get monthly metrics
    const monthlyMetricsQuery = `
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(credit) as revenue,
        SUM(debit) as expenses
      FROM transactions
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
      LIMIT 12`;

    // Get department metrics
    const departmentMetricsQuery = `
      SELECT 
        department,
        SUM(credit) as revenue
      FROM transactions
      WHERE credit > 0
      GROUP BY department
      ORDER BY revenue DESC`;

    // Get expense categories
    const expenseCategoriesQuery = `
      SELECT 
        category,
        SUM(debit) as total
      FROM transactions
      WHERE debit > 0
      GROUP BY category
      ORDER BY total DESC`;

    const [monthlyResult, departmentResult, categoryResult] = await Promise.all([
      pool.query(monthlyMetricsQuery),
      pool.query(departmentMetricsQuery),
      pool.query(expenseCategoriesQuery)
    ]);

    res.json({
      monthlyMetrics: monthlyResult.rows,
      departmentMetrics: departmentResult.rows,
      expenseCategories: categoryResult.rows
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 