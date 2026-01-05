import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const jwtSecret = process.env.JWT_SECRET;

export const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN, 
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
};

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);
