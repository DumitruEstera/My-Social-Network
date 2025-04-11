import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "your_jwt_secret_key";

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      isAdmin: user.isAdmin || false  // Include isAdmin field in token
    }, 
    secret, 
    { expiresIn: '1h' }
  );
};

export const auth = (req, res, next) => {
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
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// New middleware for admin-only routes
export const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
  });
};