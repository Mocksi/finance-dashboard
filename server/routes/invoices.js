const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Add workflow validation middleware
const validateStatusTransition = (req, res, next) => {
  const allowedTransitions = {
    draft: ['sent', 'cancelled'],
    sent: ['paid', 'overdue', 'cancelled'],
    paid: ['refunded'],
    overdue: ['paid', 'cancelled'],
    cancelled: [],
    refunded: []
  };

  const currentStatus = req.invoice.status;
  const newStatus = req.body.status;

  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    return res.status(400).json({
      error: 'Invalid status transition',
      message: `Cannot transition from ${currentStatus} to ${newStatus}`
    });
  }

  next();
};

// Add invoice lookup middleware
const lookupInvoice = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1::uuid',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    req.invoice = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

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
    const { clientName, amount, dueDate, status, items } = req.body;

    // Validate required fields
    if (!clientName) throw new Error('Client name is required');
    if (!dueDate) throw new Error('Due date is required');
    if (!Array.isArray(items)) throw new Error('Items must be an array');

    const result = await pool.query(
      `INSERT INTO invoices 
        (client_name, amount, status, due_date, items)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [clientName, amount, status || 'draft', dueDate, JSON.stringify(items)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to create invoice',
      details: error.message
    });
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', auth, lookupInvoice, validateStatusTransition, async (req, res) => {
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

    // Send notification based on status change
    switch (status) {
      case 'sent':
        // TODO: Send email to client
        break;
      case 'paid':
        // TODO: Update accounting system
        break;
      case 'overdue':
        // TODO: Send reminder email
        break;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
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