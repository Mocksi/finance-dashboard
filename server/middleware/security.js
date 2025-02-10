const securityHeaders = (_req, res, next) => {
    // Cache control
    res.set('Cache-Control', 'no-store');

    // Full CSP as seen in superframe.com
    /*
    res.set('Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' " +
        "https://api.segment.io/ " +
        "https://cdn.segment.com/v1/projects/AAsmATKBPE7wyNlfwG4gQ9fs85rT8hUp/ " +
        "https://o4505116382789632.ingest.sentry.io/api/4505993534701568/ " +
        "https://events.launchdarkly.com/ " +
        "https://clientstream.launchdarkly.com/ " +
        "wss://clientstream.launchdarkly.com/ " +  // Added WebSocket support
        "https://*.launchdarkly.com/ " +
        "https://api.mocksi.ai/; " +  // Added Mocksi API
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' * data: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://onrender.com/; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "frame-src 'self' https://api.mocksi.ai/; " +  // Added frame-src for Mocksi
        "manifest-src 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests; " +
        "block-all-mixed-content; "
    );
    */
    res.set('Content-Security-Policy',
        "default-src 'self'; " +
        "connect-src 'self' " +
        "https://api.segment.io/ " +
        "http://localhost:3030/; " +
        "frame-src 'self' https://api.mocksi.ai/ http://localhost:3030/; " +
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
        'https://finance-dashboard-tfn6.onrender.com',
        'http://localhost:3000',
        'https://events.launchdarkly.com',
        'https://clientstream.launchdarkly.com',
        'https://api.mocksi.ai'  // Added Mocksi origin
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'LD-API-Key',
        'X-API-Key',  // Added for Mocksi API authentication
        'X-Client-Version'  // Added for version tracking
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