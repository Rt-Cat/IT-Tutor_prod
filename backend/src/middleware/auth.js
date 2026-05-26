const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.USER_ID || user.id,
      email: user.EMAIL || user.email,
      role: user.ROLE_NAME || user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
async function authenticate(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get fresh user data
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = {
      id: user.USER_ID,
      email: user.EMAIL,
      role: user.ROLE_NAME,
      firstName: user.FIRST_NAME,
      lastName: user.LAST_NAME,
      isActive: user.IS_ACTIVE
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Role-based authorization middleware
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role?.toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Optional authentication (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await userRepository.findById(decoded.id);
        if (user) {
          req.user = {
            id: user.USER_ID,
            email: user.EMAIL,
            role: user.ROLE_NAME,
            firstName: user.FIRST_NAME,
            lastName: user.LAST_NAME
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  JWT_SECRET
};