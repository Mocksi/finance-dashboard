const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET /api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        client_name,
        amount,
        status,
        due_date,
        created_at,
        updated_at
      FROM invoices 
      ORDER BY created_at DESC
    `);

    res.json({
      invoices: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// POST /api/invoices
router.post('/', auth, async (req, res) => {
  try {
    const { clientName, amount, dueDate, items } = req.body;

    const result = await pool.query(
      `INSERT INTO invoices 
        (client_name, amount, status, due_date, items)
       VALUES ($1, $2, 'draft', $3, $4)
       RETURNING *`,
      [clientName, amount, dueDate, JSON.stringify(items)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to create invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE invoices 
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2::uuid
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ 
      error: 'Failed to update invoice status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// PUT /api/invoices/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, amount, dueDate, status, items } = req.body;

    const result = await pool.query(
      `UPDATE invoices 
       SET client_name = $1,
           amount = $2,
           due_date = $3,
           status = $4,
           items = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6::uuid
       RETURNING *`,
      [clientName, amount, dueDate, status, JSON.stringify(items), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to update invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router; 