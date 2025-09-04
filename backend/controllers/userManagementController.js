import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

// 1. Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await pool.query(
      `SELECT u.*, c.name as college_name 
       FROM users u 
       LEFT JOIN colleges c ON u.college_id = c.id 
       WHERE u.id = ?`,
      [userId]
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
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// 2. List users
export const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, college_id, status, department, batch } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let conditions = [];
    let params = [];
    
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (role && role !== 'all') {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (college_id && college_id !== 'all') {
      conditions.push('u.college_id = ?');
      params.push(college_id);
    }
    if (status && status !== 'all') {
      conditions.push('u.is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }
    if (department && department !== 'all') {
      conditions.push('u.department = ?');
      params.push(department);
    }
    if (batch && batch !== 'all') {
      conditions.push('u.batch = ?');
      params.push(batch);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get users with pagination - including password field
    const sql = `SELECT u.*, c.name as college_name 
                 FROM users u 
                 LEFT JOIN colleges c ON u.college_id = c.id 
                 ${whereClause} 
                 ORDER BY u.id DESC 
                 LIMIT ? OFFSET ?`;
    
    const userParams = [...params, limitNum, offset];
    const [users] = await pool.query(sql, userParams);
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({ 
      success: true, 
      data: users,
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total, 
        totalPages 
      } 
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// 2. Add user
export const addUser = async (req, res) => {
  try {
    const { name, email, role, college_id, department, batch, student_id, phone, is_active, joining_year, final_year } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Format name to Title Case and email to lowercase
    const formattedName = name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const formattedEmail = email.toLowerCase().trim();
    
    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [formattedEmail]);
    if (userRows.length) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    let password = '';
    let finalStudentId = student_id;
    let finalJoiningYear = null;
    let finalFinalYear = null;
    let finalCurrentYear = null;
    let yearStartDate = null;
    
    // For students, student_id is mandatory and becomes the password
    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ success: false, message: 'Student ID (Roll Number) is required for students' });
      }
      
      // Convert student ID to uppercase
      finalStudentId = student_id.toUpperCase();
      
      // Check if student ID already exists (case-insensitive check)
      const [existingStudent] = await pool.query('SELECT id FROM users WHERE UPPER(student_id) = ?', [finalStudentId]);
      if (existingStudent.length > 0) {
        return res.status(400).json({ success: false, message: 'Student ID already exists' });
      }
      
      // Set joining year and final year
      if (joining_year && final_year) {
        finalJoiningYear = joining_year;
        finalFinalYear = final_year;
        finalCurrentYear = joining_year; // Start with joining year
        // Set year start date to June 1st of the joining year
        yearStartDate = `${joining_year}-06-01`;
      } else if (joining_year) {
        // Only joining year specified, assume 4-year program
        finalJoiningYear = joining_year;
        finalFinalYear = joining_year + 4;
        finalCurrentYear = joining_year;
        yearStartDate = `${joining_year}-06-01`;
      } else {
        // Default to current year if not specified
        const currentYear = new Date().getFullYear();
        finalJoiningYear = currentYear;
        finalFinalYear = currentYear + 4;
        finalCurrentYear = currentYear;
        yearStartDate = `${currentYear}-06-01`;
      }
      
      password = finalStudentId; // Use uppercase roll number as password
    } else {
      // Generate random password for non-students
      password = Math.random().toString(36).slice(-8);
    }
    
    const id = uuidv4();
    await pool.query(
      `INSERT INTO users (id, email, password, name, role, college_id, department, batch, student_id, joining_year, final_year, current_year, year_start_date, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, formattedEmail, password, formattedName, role, college_id, department, batch || null, finalStudentId, finalJoiningYear, finalFinalYear, finalCurrentYear, yearStartDate, phone, is_active !== false]
    );
    
    res.json({ 
      success: true, 
      message: 'User created successfully', 
      id,
      data: {
        password,
        student_id: finalStudentId,
        joining_year: finalJoiningYear,
        final_year: finalFinalYear,
        current_year: finalCurrentYear
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 3. Edit user
export const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, college_id, department, batch, student_id, admission_type, phone, is_active, joining_year, final_year } = req.body;
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Format name to Title Case and email to lowercase
    const formattedName = name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const formattedEmail = email.toLowerCase().trim();
    
    // Check if email already exists for other users
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [formattedEmail, userId]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    let yearStartDate = null;
    let currentYear = null;
    let finalStudentId = student_id;
    
    // Handle student year update and convert student ID to uppercase
    if (role === 'student' && student_id) {
      finalStudentId = student_id.toUpperCase();
      
      // Check if student ID already exists for other users (case-insensitive check)
      const [existingStudent] = await pool.query('SELECT id FROM users WHERE UPPER(student_id) = ? AND id != ?', [finalStudentId, userId]);
      if (existingStudent.length > 0) {
        return res.status(400).json({ success: false, message: 'Student ID already exists' });
      }
    }
    
    if (role === 'student' && joining_year && final_year) {
      yearStartDate = `${joining_year}-06-01`;
      // Calculate current year based on joining year and current date
      const currentDate = new Date();
      const yearDiff = Math.floor((currentDate - new Date(yearStartDate)) / (1000 * 60 * 60 * 24 * 365));
      currentYear = Math.min(joining_year + yearDiff, final_year);
    }
    
    await pool.query(
      `UPDATE users SET name=?, email=?, role=?, college_id=?, department=?, batch=?, student_id=?, admission_type=?, joining_year=?, final_year=?, current_year=?, year_start_date=?, phone=?, is_active=? WHERE id=?`,
      [formattedName, formattedEmail, role, college_id, department, batch || null, finalStudentId, admission_type || 'regular', joining_year, final_year, currentYear, yearStartDate, phone, is_active !== false, userId]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 4. Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 5. Toggle user status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const [userRows] = await pool.query('SELECT id, is_active FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const newStatus = !userRows[0].is_active;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);
    res.json({ success: true, message: `User status set to ${newStatus ? 'active' : 'inactive'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 6. Reset user password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const [userRows] = await pool.query('SELECT id, role, student_id FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userRows[0];
    let newPassword = '';
    
    if (user.role === 'student') {
      if (!user.student_id) {
        return res.status(400).json({ success: false, message: 'Student ID not found for this user' });
      }
      newPassword = user.student_id.toUpperCase(); // Ensure student ID is in uppercase
    } else {
      newPassword = Math.random().toString(36).slice(-8); // Generate random password
    }
    
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      data: {
        password: newPassword
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// 7. Download Excel template
export const downloadTemplate = (req, res) => {
  try {
    const { type } = req.params;
    const templatePath = path.resolve(`backend/database/${type}_upload_template.xlsx`);
    
    if (fs.existsSync(templatePath)) {
      res.download(templatePath, `${type}_upload_template.xlsx`);
    } else {
      res.status(404).json({ success: false, message: 'Template not found' });
    }
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 8. Bulk upload users
export const bulkUploadUsers = async (req, res) => {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
    }
    
    const file = files.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    try {
      const workbook = xlsx.readFile(file.filepath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      
      const errors = [];
      let uploaded = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row.name || !row.email || !row.role) {
          continue;
        }
        
        try {
          // Check if user already exists
          const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [row.email.toLowerCase().trim()]);
          if (existingUsers.length > 0) {
            errors.push({ row: i + 2, error: `Email already exists: ${row.email}` });
            continue;
          }
          
          // Format name to Title Case and email to lowercase
          const formattedName = row.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
          const formattedEmail = row.email.toLowerCase().trim();
          
          // Get college ID if college_code is provided
          let college_id = null;
          if (row.college_code) {
            const [collegeRows] = await pool.query('SELECT id FROM colleges WHERE code = ?', [row.college_code]);
            if (collegeRows.length > 0) {
              college_id = collegeRows[0].id;
            }
          }
          
          // Generate password and student ID
          let password = '';
          let finalStudentId = row.student_id;
          
          if (row.role === 'student') {
            // Student ID is mandatory for students
            if (!row.student_id) {
              errors.push({ row: i + 2, error: `Student ID is required for students: ${formattedEmail}` });
              continue;
            }
            
            // Convert student ID to uppercase
            finalStudentId = row.student_id.toUpperCase();
            
            // Check if student ID already exists (case-insensitive check)
            const [existingStudent] = await pool.query('SELECT id FROM users WHERE UPPER(student_id) = ?', [finalStudentId]);
            if (existingStudent.length > 0) {
              errors.push({ row: i + 2, error: `Student ID already exists: ${finalStudentId}` });
              continue;
            }
            
            password = finalStudentId; // Use uppercase roll number as password
          } else {
            password = Math.random().toString(36).slice(-8);
          }
          
          // Set student year fields for students
          let joiningYear = null;
          let finalYear = null;
          let currentYear = null;
          let yearStartDate = null;
          let admissionType = 'regular';
          
          if (row.role === 'student') {
            // Handle admission type
            admissionType = row.admission_type || 'regular';
            
            if (row.joining_year && row.final_year) {
              joiningYear = row.joining_year;
              finalYear = row.final_year;
              // For lateral students, add +1 year to calculations
              if (admissionType === 'lateral') {
                joiningYear = row.joining_year + 1;
                finalYear = row.final_year + 1;
              }
              currentYear = joiningYear; // Start with effective joining year
              yearStartDate = `${joiningYear}-06-01`;
            } else if (row.joining_year) {
              // Only joining year specified, assume 4-year program
              joiningYear = row.joining_year;
              finalYear = row.joining_year + 4;
              // For lateral students, add +1 year to calculations
              if (admissionType === 'lateral') {
                joiningYear = row.joining_year + 1;
                finalYear = row.joining_year + 5;
              }
              currentYear = joiningYear;
              yearStartDate = `${joiningYear}-06-01`;
            } else {
              // Default to current year if not specified
              const currentYearValue = new Date().getFullYear();
              joiningYear = currentYearValue;
              finalYear = currentYearValue + 4;
              // For lateral students, add +1 year to calculations
              if (admissionType === 'lateral') {
                joiningYear = currentYearValue + 1;
                finalYear = currentYearValue + 5;
              }
              currentYear = joiningYear;
              yearStartDate = `${joiningYear}-06-01`;
            }
          }
          
          // Insert user
          const id = uuidv4();
          await pool.query(
            `INSERT INTO users (id, email, password, name, role, college_id, department, batch, student_id, admission_type, joining_year, final_year, current_year, year_start_date, phone, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              formattedEmail, 
              password, 
              formattedName, 
              row.role, 
              college_id, 
              row.department || null, 
              row.batch || null,
              finalStudentId, 
              admissionType,
              joiningYear,
              finalYear,
              currentYear,
              yearStartDate,
              row.phone || null, 
              row.status !== 'inactive'
            ]
          );
          
          uploaded++;
        } catch (rowError) {
          errors.push({ row: i + 2, error: rowError.message });
        }
      }
      
      res.json({ 
        success: true, 
        data: { uploaded, errors },
        message: `Successfully uploaded ${uploaded} users${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      });
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Excel parse error', 
        error: error.message 
      });
    }
  });
}; 

// 9. Change user password (Super Admin only)
export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required and must be at least 4 characters long' 
      });
    }
    
    // Check if user exists
    const [userRows] = await pool.query('SELECT id, role, student_id FROM users WHERE id = ?', [userId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userRows[0];
    
    // For students, if no password provided, use student_id as default
    let finalPassword = newPassword;
    if (user.role === 'student' && !newPassword) {
      if (!user.student_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID not found for this user' 
        });
      }
      finalPassword = user.student_id;
    }
    
    // Update password (store as plain text for Super Admin visibility)
    await pool.query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [finalPassword, userId]);
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully',
      data: {
        password: finalPassword
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}; 

// 10. Update student years (Super Admin only)
export const updateStudentYears = async (req, res) => {
  try {
    // First calculate current years based on joining and final years
    await pool.query('CALL CalculateCurrentYear()');
    
    // Then update years for eligible students
    const [result] = await pool.query('CALL UpdateStudentYears()');
    
    res.json({ 
      success: true, 
      message: 'Student years updated successfully',
      data: result[0][0] // The result from the stored procedure
    });
  } catch (error) {
    console.error('Update student years error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Get all students for assignment purposes
export const getStudents = async (req, res) => {
  try {
    const { search, department, batch, college_id } = req.query;
    
    let conditions = ['u.role = ?'];
    let params = ['student'];
    
    if (search) {
      conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (department && department !== 'all') {
      conditions.push('u.department = ?');
      params.push(department);
    }
    
    if (batch && batch !== 'all') {
      conditions.push('u.batch = ?');
      params.push(batch);
    }
    
    if (college_id && college_id !== 'all') {
      conditions.push('u.college_id = ?');
      params.push(college_id);
    }
    
    // Only get active students
    conditions.push('u.is_active = 1');
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.student_id as roll_number,
        u.department,
        u.batch,
        u.college_id,
        c.name as college_name
      FROM users u
      LEFT JOIN colleges c ON u.college_id = c.id
      ${whereClause}
      ORDER BY u.first_name, u.last_name
    `;
    
    const [rows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
}; 