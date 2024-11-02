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
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC`;

    const result = await pool.query(monthlyMetricsQuery);

    res.json({
      monthlyMetrics: result.rows,
      departmentMetrics: [],
      expenseCategories: [],
      invoiceProjections: []
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router; 