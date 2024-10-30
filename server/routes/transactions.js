const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const sortKey = req.query.sortKey || 'date';
    const sortDir = req.query.sortDir || 'desc';
    
    const offset = (page - 1) * pageSize;

    // Validate sort parameters
    const allowedSortKeys = ['date', 'description', 'category', 'department', 'amount'];
    const validatedSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'date';
    const validatedSortDir = ['asc', 'desc'].includes(sortDir) ? sortDir : 'desc';

    // Handle special case for amount sorting
    const sortClause = validatedSortKey === 'amount' 
      ? `COALESCE(credit, -debit) ${validatedSortDir}`
      : `${validatedSortKey} ${validatedSortDir}`;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions'
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated and sorted transactions
    const result = await pool.query(
      `SELECT 
        id, date, description, category, department, 
        credit, debit,
        COALESCE(credit, -debit) as amount
       FROM transactions 
       ORDER BY ${sortClause}
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    res.json({
      transactions: result.rows,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, category, department, credit, debit } = req.body;

    const result = await pool.query(
      `UPDATE transactions 
       SET date = $1, 
           description = $2, 
           category = $3, 
           department = $4, 
           credit = $5, 
           debit = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [date, description, category, department, credit, debit, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

module.exports = router; 