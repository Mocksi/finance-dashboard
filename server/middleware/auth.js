const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
            .toString()
            .split(':');
        
        if (email === 'admin@company.com' && password === 'testpass123') {
            next();
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = auth; 