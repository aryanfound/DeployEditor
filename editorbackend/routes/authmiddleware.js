const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authMiddleware = (req, res, next) => {
    console.log('Middleware triggered:', req.originalUrl);
    
    // Allow unauthenticated access to login and signup routes
    if (req.originalUrl === '/auth/signup' || req.originalUrl === '/auth/login') {
        console.log('Public route accessed, skipping authentication');
        return next();
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('Token verified successfully');

        // Handle authentication check at root URL (`/`)
        if (req.originalUrl === '/') {
            console.log('Authenticated request to `/`, sending success response');
            return res.status(200).json({ message: 'Authenticated' });
        }

        next();
    } catch (error) {
        console.error('Invalid token:', error.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = { authMiddleware };
