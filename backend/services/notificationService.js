import { pool } from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Create notification in database
 */
export const createNotification = async (notificationData) => {
  try {
    const {
      user_id,
      type = 'in_app',
      category = 'other',
      title,
      message,
      related_entity_type,
      related_entity_id
    } = notificationData;

    if (!user_id || !title || !message) {
      throw new Error('user_id, title, and message are required');
    }

    const notificationId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO notifications (
        id, user_id, type, category, title, message,
        related_entity_type, related_entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificationId, user_id, type, category, title, message,
        related_entity_type || null, related_entity_id || null
      ]
    );

    return notificationId;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send email notification
 */
export const sendEmailNotification = async (to, subject, html, text) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn('SMTP credentials not configured. Email notification skipped.');
      return false;
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'LMS Platform'}" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html || text,
      text: text
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send SMS notification (placeholder - requires SMS gateway integration)
 */
export const sendSMSNotification = async (phoneNumber, message) => {
  try {
    // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
    logger.info(`SMS notification to ${phoneNumber}: ${message}`);
    return true;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return false;
  }
};

/**
 * Send WhatsApp notification (placeholder - requires WhatsApp Business API)
 */
export const sendWhatsAppNotification = async (phoneNumber, message) => {
  try {
    // TODO: Integrate with WhatsApp Business API (Twilio, etc.)
    logger.info(`WhatsApp notification to ${phoneNumber}: ${message}`);
    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp:', error);
    return false;
  }
};

/**
 * Notification templates
 */
const notificationTemplates = {
  trainer_assigned: {
    email: {
      subject: 'You have been assigned to a new project',
      html: (data) => `
        <h2>New Project Assignment</h2>
        <p>Dear ${data.trainer_name},</p>
        <p>You have been assigned to the following project:</p>
        <ul>
          <li><strong>Project:</strong> ${data.project_name}</li>
          <li><strong>College:</strong> ${data.college_name}</li>
          <li><strong>Allocated Hours:</strong> ${data.allocated_hours}</li>
          <li><strong>Hourly Rate:</strong> ₹${data.hourly_rate}</li>
        </ul>
        <p>Please check your dashboard for more details.</p>
        <p>Best regards,<br>LMS Platform Team</p>
      `
    },
    sms: (data) => `You have been assigned to project ${data.project_name}. Check your dashboard for details.`,
    whatsapp: (data) => `🎓 New Assignment!\n\nYou have been assigned to ${data.project_name}.\n\nAllocated Hours: ${data.allocated_hours}\nHourly Rate: ₹${data.hourly_rate}\n\nCheck your dashboard for more details.`
  },
  trainer_replaced: {
    email: {
      subject: 'Faculty Replacement Notification',
      html: (data) => `
        <h2>Faculty Replacement</h2>
        <p>Dear ${data.trainer_name},</p>
        <p>You have been replaced in the following project:</p>
        <ul>
          <li><strong>Project:</strong> ${data.project_name}</li>
          <li><strong>Reason:</strong> ${data.reason}</li>
        </ul>
        <p>All future sessions have been reassigned.</p>
        <p>Best regards,<br>LMS Platform Team</p>
      `
    },
    sms: (data) => `You have been replaced in project ${data.project_name}. Reason: ${data.reason}`,
    whatsapp: (data) => `⚠️ Faculty Replacement\n\nYou have been replaced in ${data.project_name}.\n\nReason: ${data.reason}`
  },
  schedule_updated: {
    email: {
      subject: 'Schedule Updated',
      html: (data) => `
        <h2>Schedule Update</h2>
        <p>Dear ${data.user_name},</p>
        <p>Your schedule has been updated:</p>
        <ul>
          <li><strong>Project:</strong> ${data.project_name}</li>
          <li><strong>Changes:</strong> ${data.changes}</li>
        </ul>
        <p>Please check your calendar for the updated schedule.</p>
        <p>Best regards,<br>LMS Platform Team</p>
      `
    },
    sms: (data) => `Your schedule for ${data.project_name} has been updated. Check your calendar.`,
    whatsapp: (data) => `📅 Schedule Updated\n\nYour schedule for ${data.project_name} has been updated.\n\nCheck your calendar for details.`
  },
  invoice_generated: {
    email: {
      subject: 'Invoice Generated',
      html: (data) => `
        <h2>Invoice Generated</h2>
        <p>Dear ${data.faculty_name},</p>
        <p>Your invoice for the billing period ${data.billing_period} has been generated.</p>
        <ul>
          <li><strong>Invoice Number:</strong> ${data.invoice_number}</li>
          <li><strong>Net Payable:</strong> ₹${data.net_payable}</li>
        </ul>
        <p>Please find the invoice attached or download it from your dashboard.</p>
        <p>Best regards,<br>LMS Platform Team</p>
      `
    },
    sms: (data) => `Invoice ${data.invoice_number} generated. Net Payable: ₹${data.net_payable}`,
    whatsapp: (data) => `💰 Invoice Generated\n\nInvoice #: ${data.invoice_number}\nNet Payable: ₹${data.net_payable}\n\nBilling Period: ${data.billing_period}`
  },
  attendance_pending: {
    email: {
      subject: 'Attendance Pending',
      html: (data) => `
        <h2>Attendance Reminder</h2>
        <p>Dear ${data.faculty_name},</p>
        <p>You have a session scheduled:</p>
        <ul>
          <li><strong>Session:</strong> ${data.session_title}</li>
          <li><strong>Time:</strong> ${data.session_time}</li>
          <li><strong>Batch:</strong> ${data.batch_name}</li>
        </ul>
        <p>Please mark attendance after the session.</p>
        <p>Best regards,<br>LMS Platform Team</p>
      `
    },
    sms: (data) => `Reminder: Session "${data.session_title}" at ${data.session_time}. Please mark attendance.`,
    whatsapp: (data) => `⏰ Attendance Reminder\n\nSession: ${data.session_title}\nTime: ${data.session_time}\n\nPlease mark attendance after the session.`
  }
};

/**
 * Send notification with all channels
 */
export const sendNotification = async (notificationData) => {
  try {
    const {
      user_id,
      category,
      title,
      message,
      template_data = {},
      channels = ['in_app', 'email']
    } = notificationData;

    // Get user details
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );
    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Create in-app notification
    if (channels.includes('in_app')) {
      await createNotification({
        user_id,
        type: 'in_app',
        category,
        title,
        message,
        related_entity_type: notificationData.related_entity_type,
        related_entity_id: notificationData.related_entity_id
      });
    }

    // Send email
    if (channels.includes('email') && user.email) {
      const template = notificationTemplates[category];
      if (template && template.email) {
        const emailSubject = typeof template.email.subject === 'function' 
          ? template.email.subject(template_data)
          : template.email.subject;
        const emailHtml = typeof template.email.html === 'function'
          ? template.email.html(template_data)
          : template.email.html || message;

        await sendEmailNotification(user.email, emailSubject, emailHtml, message);
      } else {
        await sendEmailNotification(user.email, title, message, message);
      }
    }

    // Send SMS
    if (channels.includes('sms') && user.phone) {
      const template = notificationTemplates[category];
      if (template && template.sms) {
        const smsMessage = typeof template.sms === 'function'
          ? template.sms(template_data)
          : template.sms;
        await sendSMSNotification(user.phone, smsMessage);
      } else {
        await sendSMSNotification(user.phone, message);
      }
    }

    // Send WhatsApp
    if (channels.includes('whatsapp') && user.phone) {
      const template = notificationTemplates[category];
      if (template && template.whatsapp) {
        const whatsappMessage = typeof template.whatsapp === 'function'
          ? template.whatsapp(template_data)
          : template.whatsapp;
        await sendWhatsAppNotification(user.phone, whatsappMessage);
      } else {
        await sendWhatsAppNotification(user.phone, message);
      }
    }

    return true;
  } catch (error) {
    logger.error('Error sending notification:', error);
    return false;
  }
};

export default {
  createNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendWhatsAppNotification,
  sendNotification,
  notificationTemplates
};
