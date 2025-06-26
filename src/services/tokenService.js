import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function signToken (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '20h' });
}

export function verifyToken (token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
