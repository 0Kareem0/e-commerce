import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId; // support old tokens
    if (!userId) return res.status(401).json({ message: 'Token invalid' });
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token failed' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();
  res.status(403).json({ message: 'Admin access required' });
};