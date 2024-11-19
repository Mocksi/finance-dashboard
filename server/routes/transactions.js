const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Add this validation function at the top
const validateSortParams = (key, dir) => {
  const allowedKeys = ['date', 'description', 'category', 'department', 'amount'];
  const allowedDirs = ['asc', 'desc'];
  
  if (!allowedKeys.includes(key)) return { key: 'date', dir: 'desc' };
  if (!allowedDirs.includes(dir)) return { key, dir: 'desc' };
  return { key, dir };
};

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const sortKey = req.query.sortKey || 'date';
    const sortDir = req.query.sortDir || 'desc';
    
    const offset = (page - 1) * pageSize;

    // Validate sort parameters
    const { key, dir } = validateSortParams(sortKey, sortDir);
    const sortClause = key === 'amount' 
      ? `COALESCE(credit, -debit) ${dir}`
      : `"${key}" ${dir}`;

    // Remove user_id from WHERE clause for now
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions'
    );
    const total = parseInt(countResult.rows[0].count);

    // Remove user_id from WHERE clause
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
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// PUT /api/transactions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, category, department, type, credit, debit } = req.body;

    // Log the incoming data for debugging
    console.log('Updating transaction:', {
      id,
      date,
      description,
      category,
      department,
      type,
      credit,
      debit
    });

    // Validate the UUID format
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ error: 'Invalid transaction ID format' });
    }

    // Convert credit/debit to numbers and handle null/undefined
    const creditValue = credit ? Number(credit) : 0;
    const debitValue = debit ? Number(debit) : 0;

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
      [
        date,
        description,
        category || '',
        department || '',
        creditValue,
        debitValue,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Log the result for debugging
    console.log('Update successful:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined 
    });
  }
});

// Add this route after your GET endpoint
router.post('/', auth, async (req, res) => {
  try {
    const { date, description, category, department, credit, debit } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions 
        (date, description, category, department, credit, debit)
      VALUES ($1, $2, $3, $4, COALESCE($5, 0), COALESCE($6, 0))
      RETURNING *`,
      [date, description, category || '', department, credit, debit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Failed to create transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router; 