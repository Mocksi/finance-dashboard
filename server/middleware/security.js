const securityHeaders = (_req, res, next) => {
    // Cache control
    res.set('Cache-Control', 'no-store');

    // Updated Content-Security-Policy
    res.set('Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' https://api.segment.io/ https://cdn.segment.com/v1/projects/AAsmATKBPE7wyNlfwG4gQ9fs85rT8hUp/ https://o4505116382789632.ingest.sentry.io/api/4505993534701568/; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' *; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "manifest-src 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests; " +
        "block-all-mixed-content; "
    );

    // Other security headers remain unchanged
    res.set('Cross-Origin-Embedder-Policy', 'credentialless');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Resource-Policy', 'same-site');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Strict-Transport-Security', 'max-age=2592000; preload');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');
    res.set('X-XSS-Protection', '1');
    next();
};

// Updated corsOptions with additional headers
const corsOptions = {
    origin: [
        'https://financy-luln.onrender.com',
        'https://finance-dashboard-tfn6.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control'
    ],
    exposedHeaders: [
        'Content-Security-Policy',
        'Cross-Origin-Embedder-Policy',
        'Cross-Origin-Opener-Policy',
        'Cross-Origin-Resource-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-Permitted-Cross-Domain-Policies',
        'X-XSS-Protection'
    ],
    maxAge: 86400 // 24 hours in seconds
};

module.exports = {
    securityHeaders,
    corsOptions
};