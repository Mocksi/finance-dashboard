const auth = async (req, res, next) => {
    console.log('Auth middleware called');
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        console.log('No auth header found');
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        console.log('Received base64 credentials:', base64Credentials);
        
        const credentials = Buffer.from(base64Credentials, 'base64').toString();
        console.log('Decoded credentials:', credentials);
        
        const [email, password] = credentials.split(':');
        console.log('Attempting login with:', { email, password });
        
        if (email === 'admin@company.com' && password === 'testpass123') {
            console.log('Login successful');
            req.user = { id: 1, email: 'admin@company.com' };
            next();
        } else {
            console.log('Invalid credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = auth; 