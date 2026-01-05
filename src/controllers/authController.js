import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "../utils/helpers.js";
import pool from "../config/mysql.js";

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      department,
      role = "staff",
    } = req.body;

    const normalizedEmail = email.toLowerCase();

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const hashedPassword = await hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password, department, role)
   VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        normalizedEmail,
        phone || null,
        hashedPassword,
        department || null,
        role,
      ]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: result.insertId,
          email: normalizedEmail,
          phone: phone || null,
          department: department || null,
          role,
          name,
        },
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const [users] = await pool.query(
      `SELECT id, name, email, phone, password, department, is_active, role
       FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const accessToken = generateToken(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      "15m"
    );

    const refreshToken = generateToken({ id: user.id }, "7d");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || null,
          department: user.department || null,
        },
        accessToken,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const [users] = await pool.query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = ?",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

   
    const newAccessToken = generateToken(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      "15m"
    );

    res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};
// Add to authController.js
export const logout = (req, res) => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};