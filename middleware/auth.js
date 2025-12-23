/**
 * Authentication Middleware
 * 
 * PROBLEM IT SOLVES: Protects routes by verifying JWT tokens. Ensures only
 * authenticated users can access protected resources.
 * 
 * HOW IT WORKS: 
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token signature and expiration
 * 3. Finds user from database using token payload
 * 4. Attaches user to request object for use in controllers
 * 
 * REAL-WORLD: This is the standard pattern used by companies like:
 * - Nykaa: Protects user orders, cart, profile endpoints
 * - Amazon: Protects checkout, account management
 * - Uses httpOnly cookies for refresh tokens (XSS protection)
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT Access Token
 * 
 * JWT FLOW EXPLANATION:
 * 1. User signs up/logs in → Server generates access + refresh tokens
 * 2. Access token sent in response → Frontend stores in memory/state
 * 3. Frontend includes token in Authorization header for protected routes
 * 4. This middleware verifies token → Extracts user info → Allows access
 * 
 * WHY ACCESS + REFRESH TOKENS?
 * - Access tokens: Short-lived (15min), stored in memory, used for API calls
 * - Refresh tokens: Long-lived (7 days), stored in httpOnly cookie, used to get new access tokens
 * - Security: If access token is stolen, it expires quickly. Refresh token in httpOnly cookie is XSS-safe.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    // Format: Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      // Find user from token payload (exclude password)
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found with this token'
        });
      }

      next(); // Proceed to next middleware/controller
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token expired or invalid. Please login again.'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to authorize specific roles
 * 
 * WHY: Not all authenticated users should access admin routes.
 * This ensures only admins can perform admin actions.
 * 
 * USAGE: Use after protect() middleware
 * Example: router.get('/admin/users', protect, authorize('admin'), getUsers)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};







