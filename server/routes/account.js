const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get profile data
router.get('/profile', auth, async (req, res) => {
    try {
        // Log the request for debugging
        console.log('Profile request received:', req.user);

        const result = await pool.query(`
            SELECT 
                u.id as user_id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.avatar_url,
                c.id as company_id,
                c.name as company_name,
                c.domain as company_domain,
                c.logo_url as company_logo
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.email = $1
        `, [req.user.email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Log the response for debugging
        console.log('Sending profile data:', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in profile route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get team members endpoint
router.get('/team', auth, async (req, res) => {
  try {
    // Get user's company_id first
    const userResult = await pool.query(
      'SELECT company_id FROM users WHERE email = $1',
      [req.user.email]
    );

    if (!userResult.rows[0]?.company_id) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.avatar_url
      FROM users u
      WHERE u.company_id = $1
      ORDER BY u.role, u.first_name, u.last_name
    `, [userResult.rows[0].company_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team members',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Update company endpoint
router.put('/company', auth, async (req, res) => {
  try {
    const { name, domain, logo_url } = req.body;
    
    // Get user's company_id first
    const userResult = await pool.query(
      'SELECT company_id FROM users WHERE email = $1',
      [req.user.email]
    );
    
    if (!userResult.rows[0]?.company_id) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const result = await pool.query(`
      UPDATE companies 
      SET 
        name = COALESCE($1, name),
        domain = COALESCE($2, domain),
        logo_url = COALESCE($3, logo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, domain, logo_url, userResult.rows[0].company_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ 
      error: 'Failed to update company',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Update profile endpoint
router.put('/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name, avatar_url } = req.body;
    
    const result = await pool.query(`
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        avatar_url = COALESCE($3, avatar_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $4
      RETURNING id, email, first_name, last_name, role, avatar_url, company_id
    `, [first_name, last_name, avatar_url, req.user.email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router; 