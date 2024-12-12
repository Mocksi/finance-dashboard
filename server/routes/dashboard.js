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
        AND date <= NOW() + INTERVAL '3 months'
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

    const invoiceProjectionsQuery = `
      SELECT 
        DATE_TRUNC('month', due_date) as month,
        COALESCE(SUM(amount), 0) as projected_revenue
      FROM invoices
      WHERE status IN ('draft', 'sent', 'overdue')
        AND due_date >= NOW() - INTERVAL '11 months'
        AND due_date <= NOW() + INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', due_date)
      ORDER BY month ASC`;

    const [monthlyResult, departmentResult, categoryResult, projectionsResult] = await Promise.all([
      pool.query(monthlyMetricsQuery),
      pool.query(departmentMetricsQuery),
      pool.query(expenseCategoriesQuery),
      pool.query(invoiceProjectionsQuery)
    ]);

    res.json({
      monthlyMetrics: monthlyResult.rows,
      departmentMetrics: departmentResult.rows,
      expenseCategories: categoryResult.rows,
      invoiceProjections: projectionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 