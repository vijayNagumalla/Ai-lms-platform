import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit';

// ============================================================
// INVOICE CONTROLLER
// ============================================================

/**
 * Generate invoice for a faculty (monthly)
 */
export const generateInvoice = async (req, res) => {
  try {
    const { faculty_id, billing_period_start, billing_period_end } = req.body;

    if (!faculty_id || !billing_period_start || !billing_period_end) {
      return res.status(400).json({
        success: false,
        message: 'faculty_id, billing_period_start, and billing_period_end are required'
      });
    }

    // Get faculty details
    const [faculty] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "faculty"',
      [faculty_id]
    );
    if (faculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Get faculty allocation
    const [allocations] = await pool.query(
      `SELECT fa.*, p.name as project_name, p.college_id
       FROM faculty_allocations fa
       LEFT JOIN projects p ON fa.project_id = p.id
       WHERE fa.faculty_id = ? AND fa.allocation_status = 'confirmed'`,
      [faculty_id]
    );
    if (allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active allocations found for this faculty'
      });
    }

    // Get sessions in billing period
    const [sessions] = await pool.query(
      `SELECT s.*, p.name as project_name, p.college_id
       FROM sessions s
       LEFT JOIN projects p ON s.project_id = p.id
       WHERE s.faculty_id = ?
         AND s.status = 'completed'
         AND DATE(s.start_time) >= ?
         AND DATE(s.start_time) <= ?
       ORDER BY s.start_time ASC`,
      [faculty_id, billing_period_start, billing_period_end]
    );

    // Calculate hours and amounts
    const allocationMap = {};
    allocations.forEach(allocation => {
      allocationMap[allocation.project_id] = allocation;
    });

    let totalHours = 0;
    const invoiceItems = [];

    sessions.forEach(session => {
      const allocation = allocationMap[session.project_id];
      if (allocation) {
        const hours = session.duration_minutes / 60;
        totalHours += hours;
        invoiceItems.push({
          project_id: session.project_id,
          project_name: session.project_name,
          session_id: session.id,
          session_date: session.start_time,
          hours: hours,
          hourly_rate: allocation.hourly_rate,
          amount: hours * allocation.hourly_rate
        });
      }
    });

    if (totalHours === 0) {
      return res.status(400).json({
        success: false,
        message: 'No completed sessions in the billing period'
      });
    }

    // Calculate amounts
    const hourlyRate = allocations[0].hourly_rate;
    const employmentType = allocations[0].employment_type;
    const subtotal = totalHours * hourlyRate;
    const tdsPercentage = employmentType === 'freelancer' ? 10 : 0;
    const tdsAmount = (subtotal * tdsPercentage) / 100;
    const netPayable = subtotal - tdsAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Get college details
    const collegeId = allocations[0].college_id;
    const [colleges] = await pool.query('SELECT * FROM colleges WHERE id = ?', [collegeId]);

    // Create invoice
    const invoiceId = crypto.randomUUID();
    const invoiceDate = new Date().toISOString().split('T')[0];

    await pool.query(
      `INSERT INTO invoices (
        id, invoice_number, faculty_id, college_id,
        billing_period_start, billing_period_end, invoice_date,
        total_hours, hourly_rate, subtotal, tds_percentage,
        tds_amount, net_payable, employment_type, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        invoiceId, invoiceNumber, faculty_id, collegeId,
        billing_period_start, billing_period_end, invoiceDate,
        totalHours, hourlyRate, subtotal, tdsPercentage,
        tdsAmount, netPayable, employmentType, req.user.id
      ]
    );

    // Add invoice items
    for (const item of invoiceItems) {
      const itemId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO invoice_items (
          id, invoice_id, project_id, session_id, hours,
          hourly_rate, amount, session_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId, invoiceId, item.project_id, item.session_id,
          item.hours, item.hourly_rate, item.amount, item.session_date
        ]
      );
    }

    // Generate PDF
    const pdfUrl = await generateInvoicePDF(invoiceId, {
      invoiceNumber,
      faculty: faculty[0],
      college: colleges[0],
      billingPeriod: { start: billing_period_start, end: billing_period_end },
      items: invoiceItems,
      subtotal,
      tdsAmount,
      netPayable,
      totalHours
    });

    // Update invoice with PDF URL
    await pool.query(
      'UPDATE invoices SET pdf_url = ?, status = "sent" WHERE id = ?',
      [pdfUrl, invoiceId]
    );

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        id: invoiceId,
        invoice_number: invoiceNumber,
        pdf_url: pdfUrl
      }
    });
  } catch (error) {
    logger.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};

/**
 * Get invoices
 */
export const getInvoices = async (req, res) => {
  try {
    const { faculty_id, college_id, status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT i.*,
        u.name as faculty_name,
        u.email as faculty_email,
        c.name as college_name
      FROM invoices i
      LEFT JOIN users u ON i.faculty_id = u.id
      LEFT JOIN colleges c ON i.college_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (userRole === 'faculty') {
      sql += ' AND i.faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'college-admin') {
      sql += ' AND i.college_id = ?';
      params.push(req.user.college_id);
    }

    if (faculty_id) {
      sql += ' AND i.faculty_id = ?';
      params.push(faculty_id);
    }
    if (college_id) {
      sql += ' AND i.college_id = ?';
      params.push(college_id);
    }
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY i.invoice_date DESC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [invoices] = await pool.query(sql, params);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    logger.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: error.message
    });
  }
};

/**
 * Generate invoice PDF
 */
async function generateInvoicePDF(invoiceId, invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;
      const filepath = `./temp/invoices/${filename}`;

      // Create directory if it doesn't exist
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoiceData.invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${invoiceData.billingPeriod.start}`, { align: 'right' });
      doc.moveDown();

      // Faculty details
      doc.fontSize(14).text('Bill To:', { underline: true });
      doc.fontSize(12).text(invoiceData.faculty.name);
      doc.text(invoiceData.faculty.email);
      doc.moveDown();

      // College details
      doc.fontSize(14).text('College:', { underline: true });
      doc.fontSize(12).text(invoiceData.college.name);
      doc.moveDown();

      // Billing period
      doc.text(`Billing Period: ${invoiceData.billingPeriod.start} to ${invoiceData.billingPeriod.end}`);
      doc.moveDown();

      // Items table
      let y = doc.y;
      doc.fontSize(12);
      doc.text('Project', 50, y);
      doc.text('Hours', 250, y);
      doc.text('Rate', 300, y);
      doc.text('Amount', 400, y);
      y += 20;
      doc.moveTo(50, y).lineTo(500, y).stroke();
      y += 10;

      invoiceData.items.forEach(item => {
        doc.text(item.project_name, 50, y, { width: 200 });
        doc.text(item.hours.toFixed(2), 250, y);
        doc.text(`₹${item.hourly_rate}`, 300, y);
        doc.text(`₹${item.amount.toFixed(2)}`, 400, y);
        y += 20;
      });

      y += 10;
      doc.moveTo(50, y).lineTo(500, y).stroke();
      y += 20;

      // Totals
      doc.text('Subtotal:', 300, y);
      doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 400, y);
      y += 20;
      doc.text('TDS (10%):', 300, y);
      doc.text(`₹${invoiceData.tdsAmount.toFixed(2)}`, 400, y);
      y += 20;
      doc.fontSize(14).text('Net Payable:', 300, y);
      doc.text(`₹${invoiceData.netPayable.toFixed(2)}`, 400, y);

      doc.end();

      stream.on('finish', () => {
        resolve(`/invoices/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

