import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate monthly invoices for all active faculty
 * This function is called by the cron job on the 25th of each month
 */
export const generateMonthlyInvoices = async () => {
  try {
    logger.info('Starting monthly invoice generation...');

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Billing period: 1st to 25th of current month
    const billingPeriodStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const billingPeriodEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`;
    const invoiceDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`;

    // Get all active faculty allocations
    const [allocations] = await pool.query(
      `SELECT DISTINCT fa.faculty_id, fa.hourly_rate, fa.employment_type
       FROM faculty_allocations fa
       INNER JOIN projects p ON fa.project_id = p.id
       WHERE fa.allocation_status = 'confirmed'
         AND p.status IN ('live', 'scheduling', 'admin_allocation')
       GROUP BY fa.faculty_id, fa.hourly_rate, fa.employment_type`
    );

    logger.info(`Found ${allocations.length} faculty members to generate invoices for`);

    const generatedInvoices = [];

    for (const allocation of allocations) {
      try {
        // Get faculty details
        const [faculty] = await pool.query(
          'SELECT * FROM users WHERE id = ? AND role = "faculty"',
          [allocation.faculty_id]
        );
        if (faculty.length === 0) continue;

        // Get completed sessions in billing period
        const [sessions] = await pool.query(
          `SELECT s.*, p.name as project_name, p.college_id
           FROM sessions s
           LEFT JOIN projects p ON s.project_id = p.id
           WHERE s.faculty_id = ?
             AND s.status = 'completed'
             AND DATE(s.start_time) >= ?
             AND DATE(s.start_time) <= ?
           ORDER BY s.start_time ASC`,
          [allocation.faculty_id, billingPeriodStart, billingPeriodEnd]
        );

        if (sessions.length === 0) {
          logger.info(`No completed sessions for faculty ${allocation.faculty_id} in billing period`);
          continue;
        }

        // Calculate hours and amounts
        let totalHours = 0;
        const invoiceItems = [];
        const projectMap = {};

        sessions.forEach(session => {
          const hours = session.duration_minutes / 60;
          totalHours += hours;

          if (!projectMap[session.project_id]) {
            projectMap[session.project_id] = {
              project_id: session.project_id,
              project_name: session.project_name,
              hours: 0,
              amount: 0
            };
          }

          projectMap[session.project_id].hours += hours;
          projectMap[session.project_id].amount += hours * allocation.hourly_rate;

          invoiceItems.push({
            project_id: session.project_id,
            project_name: session.project_name,
            session_id: session.id,
            session_date: session.start_time,
            hours: hours,
            hourly_rate: allocation.hourly_rate,
            amount: hours * allocation.hourly_rate
          });
        });

        // Calculate amounts
        const subtotal = totalHours * allocation.hourly_rate;
        const tdsPercentage = allocation.employment_type === 'freelancer' ? 10 : 0;
        const tdsAmount = (subtotal * tdsPercentage) / 100;
        const netPayable = subtotal - tdsAmount;

        // Generate invoice number
        const invoiceNumber = `INV-${currentYear}-${String(Date.now()).slice(-6)}`;

        // Get college details (use first project's college)
        const collegeId = sessions[0].college_id;
        const [colleges] = await pool.query('SELECT * FROM colleges WHERE id = ?', [collegeId]);

        // Create invoice
        const invoiceId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO invoices (
            id, invoice_number, faculty_id, college_id,
            billing_period_start, billing_period_end, invoice_date,
            total_hours, hourly_rate, subtotal, tds_percentage,
            tds_amount, net_payable, employment_type, status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)`,
          [
            invoiceId, invoiceNumber, allocation.faculty_id, collegeId,
            billingPeriodStart, billingPeriodEnd, invoiceDate,
            totalHours, allocation.hourly_rate, subtotal, tdsPercentage,
            tdsAmount, netPayable, allocation.employment_type, 'system'
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
          college: colleges[0] || {},
          billingPeriod: { start: billingPeriodStart, end: billingPeriodEnd },
          items: Object.values(projectMap),
          subtotal,
          tdsAmount,
          netPayable,
          totalHours,
          hourlyRate: allocation.hourly_rate,
          employmentType: allocation.employment_type
        });

        // Update invoice with PDF URL
        await pool.query(
          'UPDATE invoices SET pdf_url = ? WHERE id = ?',
          [pdfUrl, invoiceId]
        );

        generatedInvoices.push({
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          faculty_id: allocation.faculty_id,
          faculty_name: faculty[0].name,
          net_payable: netPayable
        });

        logger.info(`Generated invoice ${invoiceNumber} for faculty ${faculty[0].name}`);

        // TODO: Send email notification
        // await sendInvoiceEmail(faculty[0].email, invoiceId, invoiceNumber);

      } catch (error) {
        logger.error(`Error generating invoice for faculty ${allocation.faculty_id}:`, error);
        continue; // Continue with next faculty
      }
    }

    logger.info(`Monthly invoice generation completed. Generated ${generatedInvoices.length} invoices.`);

    return {
      success: true,
      generated_count: generatedInvoices.length,
      invoices: generatedInvoices
    };
  } catch (error) {
    logger.error('Error in monthly invoice generation:', error);
    throw error;
  }
};

/**
 * Generate invoice PDF
 */
async function generateInvoicePDF(invoiceId, invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;
      const dir = path.join(__dirname, '../../temp/invoices');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filepath = path.join(dir, filename);
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Invoice #: ${invoiceData.invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${invoiceData.billingPeriod.start}`, { align: 'right' });
      doc.moveDown();

      // Faculty details
      doc.fontSize(14).text('Bill To:', { underline: true });
      doc.fontSize(12).text(invoiceData.faculty.name);
      if (invoiceData.faculty.email) doc.text(invoiceData.faculty.email);
      if (invoiceData.faculty.phone) doc.text(invoiceData.faculty.phone);
      doc.moveDown();

      // College details
      if (invoiceData.college && invoiceData.college.name) {
        doc.fontSize(14).text('College:', { underline: true });
        doc.fontSize(12).text(invoiceData.college.name);
        doc.moveDown();
      }

      // Billing period
      doc.text(`Billing Period: ${invoiceData.billingPeriod.start} to ${invoiceData.billingPeriod.end}`);
      doc.text(`Employment Type: ${invoiceData.employmentType}`);
      doc.moveDown();

      // Items table
      let y = doc.y;
      doc.fontSize(10);
      doc.text('Project', 50, y);
      doc.text('Hours', 300, y);
      doc.text('Rate', 350, y);
      doc.text('Amount', 450, y);
      y += 15;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      invoiceData.items.forEach(item => {
        doc.text(item.project_name.substring(0, 30), 50, y, { width: 250 });
        doc.text(item.hours.toFixed(2), 300, y);
        doc.text(`₹${item.hourly_rate}`, 350, y);
        doc.text(`₹${item.amount.toFixed(2)}`, 450, y);
        y += 15;
      });

      y += 5;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Totals
      doc.fontSize(12);
      doc.text('Subtotal:', 350, y);
      doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 450, y);
      y += 20;
      
      if (invoiceData.tdsAmount > 0) {
        doc.text(`TDS (${invoiceData.tdsPercentage}%):`, 350, y);
        doc.text(`₹${invoiceData.tdsAmount.toFixed(2)}`, 450, y);
        y += 20;
      }
      
      doc.fontSize(14).text('Net Payable:', 350, y, { bold: true });
      doc.text(`₹${invoiceData.netPayable.toFixed(2)}`, 450, y, { bold: true });

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

export default {
  generateMonthlyInvoices,
  generateInvoicePDF
};

