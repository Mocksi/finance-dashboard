const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Get profile data
router.get('/profile', auth, async (req, res) => {
    try {
        // Log the incoming request for debugging
        console.log('Profile request for user:', req.user.email);

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
        console.log('Profile response:', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

module.exports = router; 