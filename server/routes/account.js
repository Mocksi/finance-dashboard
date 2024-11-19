const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get company and user profile
router.get('/profile', auth, async (req, res) => {
    try {
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
            JOIN companies c ON u.company_id = c.id
            WHERE u.email = $1
        `, [req.user.email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update company details (admin only)
router.put('/company', auth, async (req, res) => {
    try {
        const { name, domain, logo_url } = req.body;
        
        // Verify user is admin
        const userCheck = await pool.query(
            'SELECT role FROM users WHERE email = $1',
            [req.user.email]
        );
        
        if (userCheck.rows[0].role !== 'Admin') {
            return res.status(403).json({ error: 'Only admins can update company details' });
        }

        const result = await pool.query(`
            UPDATE companies
            SET name = $1, domain = $2, logo_url = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT company_id FROM users WHERE email = $4)
            RETURNING *
        `, [name, domain, logo_url, req.user.email]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

module.exports = router; 