const auth = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Extract and decode credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        // Verify credentials (replace with your actual verification logic)
        if (email === 'sarah.chen@techflow.io' && password === 'testpass123') {
            req.user = { email }; // Attach user info to request
            next();
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = auth; 