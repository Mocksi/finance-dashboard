const securityHeaders = (_req, res, next) => {
    // Cache control
    res.set('Cache-Control', 'no-store');

    // Updated CSP with necessary permissions
    res.set('Content-Security-Policy',
        "default-src 'self' http://localhost:* https://financy-luln.onrender.com; " +
        "connect-src 'self' http://localhost:* https://api.segment.io/ https://financy-luln.onrender.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' * data: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://financy-luln.onrender.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "frame-src 'self' http://localhost:* https://financy-luln.onrender.com; " +
        "manifest-src 'self'; " +
        "frame-ancestors 'self' http://localhost:* https://financy-luln.onrender.com; " +
        "worker-src 'self' blob:; " +
        "base-uri 'self';"
    );

    // Updated security headers for development
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.set('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Referrer-Policy', 'no-referrer-when-downgrade');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');
    res.set('X-XSS-Protection', '1; mode=block');

    next();
};

const corsOptions = {
    origin: function(origin, callback) {
        const allowedOrigins = [
            'https://financy-luln.onrender.com',
            'https://finance-dashboard-tfn6.onrender.com',
            'http://localhost:3000',
            'http://localhost:3030',
            'https://events.launchdarkly.com',
            'https://clientstream.launchdarkly.com',
            'https://api.mocksi.ai'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Fixed DELETE string
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'LD-API-Key',
        'X-API-Key',
        'X-Client-Version'
    ],
    exposedHeaders: ['*'],  // Simplified to allow all headers
    maxAge: 86400
};

module.exports = {
    securityHeaders,
    corsOptions
};