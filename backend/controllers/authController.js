import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, name, role, college_id, department, student_id, phone, country } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, and role are required'
      });
    }

    // Validate role
    const validRoles = ['student', 'faculty', 'college-admin', 'super-admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if super admin registration is allowed
    if (role === 'super-admin') {
      // Check if there are any existing super admins
      const [existingSuperAdmins] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE',
        ['super-admin']
      );

      // If super admins already exist, require a special registration code
      if (existingSuperAdmins[0].count > 0) {
        const { registrationCode } = req.body;
        const expectedCode = process.env.SUPER_ADMIN_REGISTRATION_CODE || 'SUPER_ADMIN_2024';
        
        if (!registrationCode || registrationCode !== expectedCode) {
          return res.status(403).json({
            success: false,
            message: 'Super admin registration requires a valid registration code'
          });
        }
      }
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const [result] = await pool.execute(
      `INSERT INTO users (id, email, password, name, role, college_id, department, student_id, phone, country, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [userId, email, hashedPassword, name, role, college_id || null, department || null, student_id || null, phone || null, country || null]
    );

    // Get created user (without password)
    const [users] = await pool.execute(
      'SELECT id, email, name, role, college_id, department, student_id, phone, avatar_url, country, is_active, email_verified, created_at FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    // Registration error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, password, name, role, college_id, department, student_id, phone, avatar_url, country, is_active, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password - handle both hashed and plain text passwords
    let isPasswordValid = false;
    
    if (user.password.startsWith('$2')) {
      // Password is hashed, use bcrypt compare
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is plain text, do direct comparison
      isPasswordValid = password === user.password;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password from user object
    delete user.password;

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    // Login error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, college_id, department, student_id, phone, avatar_url, country, is_active, email_verified, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    // Get profile error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar_url, country } = req.body;
    const userId = req.user.id;

    // Update user
    const [result] = await pool.execute(
      'UPDATE users SET name = ?, phone = ?, avatar_url = ?, country = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, avatar_url, country, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, email, name, role, college_id, department, student_id, phone, avatar_url, country, is_active, email_verified, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: users[0]
    });
  } catch (error) {
    // Update profile error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get current user with password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    // Change password error
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (client-side token removal)
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}; 