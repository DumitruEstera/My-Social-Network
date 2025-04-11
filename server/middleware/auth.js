import jwt from "jsonwebtoken";
import { findUserById } from "../models/user.js";
import db from "../db/connection.js";

const secret = process.env.JWT_SECRET || "your_jwt_secret_key";

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      isAdmin: user.isAdmin || false
    }, 
    secret, 
    { expiresIn: '1h' }
  );
};

export const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    
    // Check if user is blocked (unless they're an admin)
    if (!decoded.isAdmin) {
      const user = await findUserById(db, decoded.id);
      if (user && user.blocked) {
        return res.status(403).json({ 
          msg: 'Your account has been blocked. Please contact the administrator.'
        });
      }
    }
    
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware for admin-only routes
export const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, secret);
    
    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};