/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */

const { getAdmin } = require('../config/firebase');

/**
 * Middleware to verify Firebase authentication token
 * Extracts user ID from verified token and attaches to req.user
 */
async function authenticateUser(req, res, next) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header' 
      });
    }

    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    // Verify token with Firebase Admin
    const admin = getAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name
    };

    // Continue to next middleware/route
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token has expired' 
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token format' 
      });
    }

    // Generic authentication failure
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed' 
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 * Useful for public endpoints that behave differently for authenticated users
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const admin = getAdmin();
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name
      };
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    console.log('Optional auth failed, continuing without user');
  }
  
  next();
}

module.exports = {
  authenticateUser,
  optionalAuth
};
