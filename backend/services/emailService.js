import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Check if email credentials are configured
    this.isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (this.isConfigured) {
      // Configure email transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.warn('Email service not configured: Missing SMTP credentials');
      this.transporter = null;
    }
  }

  async sendAssessmentNotification(recipients, assessmentDetails) {
    try {
      // Check if email service is configured
      if (!this.isConfigured || !this.transporter) {
        return { 
          success: false, 
          message: 'Email service not configured. Please configure SMTP settings.',
          errorType: 'NOT_CONFIGURED'
        };
      }

      const emailPromises = recipients.map(recipient => 
        this.sendSingleNotification(recipient, assessmentDetails)
      );
      
      await Promise.all(emailPromises);
      return { success: true, message: 'Email notifications sent successfully' };
    } catch (error) {
      console.error('Error sending email notifications:', error);
      return { 
        success: false, 
        message: 'Failed to send email notifications',
        error: error.message
      };
    }
  }

  async sendReminderNotification(recipients, assessmentDetails) {
    try {
      // Check if email service is configured
      if (!this.isConfigured || !this.transporter) {
        return { 
          success: false, 
          message: 'Email service not configured. Please configure SMTP settings.',
          errorType: 'NOT_CONFIGURED'
        };
      }

      const emailPromises = recipients.map(recipient => 
        this.sendSingleReminder(recipient, assessmentDetails)
      );
      
      await Promise.all(emailPromises);
      return { success: true, message: 'Reminder emails sent successfully' };
    } catch (error) {
      console.error('Error sending reminder emails:', error);
      return { 
        success: false, 
        message: 'Failed to send reminder emails',
        error: error.message
      };
    }
  }

  async sendSingleNotification(recipient, assessmentDetails) {
    const { email, name } = recipient;
    
    const emailContent = this.generateAssessmentEmail(assessmentDetails, name);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@lms-platform.com',
      to: email,
      subject: `New Assessment: ${assessmentDetails.title}`,
      html: emailContent
    };

    try {
      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${email}`);
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  async sendSingleReminder(recipient, assessmentDetails) {
    const { email, name } = recipient;
    
    const emailContent = this.generateAssessmentEmail(assessmentDetails, name, true);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@lms-platform.com',
      to: email,
      subject: `Reminder: Assessment Due Soon - ${assessmentDetails.title}`,
      html: emailContent
    };

    try {
      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }
      
      await this.transporter.sendMail(mailOptions);
      console.log(`Reminder email sent successfully to ${email}`);
    } catch (error) {
      console.error(`Failed to send reminder email to ${email}:`, error);
      throw error;
    }
  }

  generateAssessmentEmail(assessmentDetails, recipientName, isReminder = false) {
    const {
      title,
      type,
      start_date,
      end_date,
      start_time,
      end_time,
      timezone,
      instructions,
      total_points,
      proctoring_required,
      proctoring_type,
      max_attempts,
      duration_minutes,
      description,
      access_password
    } = assessmentDetails;

    const assessmentTypeLabel = this.getAssessmentTypeLabel(type);
    const proctoringInfo = proctoring_required ? 
      `This assessment requires ${proctoring_type} proctoring. Please ensure your webcam and microphone are working.` : 
      'No special proctoring requirements for this assessment.';

    // Determine assessment status
    const now = new Date();
    
    // Handle both combined datetime strings and separate date/time fields
    let startDateTime, endDateTime;
    
    // Helper function to convert date/time to string
    const dateToString = (date) => {
      if (!date) return null;
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return date.toString();
    };
    
    const timeToString = (time) => {
      if (!time) return null;
      if (typeof time === 'string') return time;
      if (time instanceof Date) return time.toTimeString().split(' ')[0];
      return time.toString();
    };
    
    const startDateStr = dateToString(start_date);
    const endDateStr = dateToString(end_date);
    const startTimeStr = timeToString(start_time);
    const endTimeStr = timeToString(end_time);
    
    if (startDateStr && startDateStr.includes('T')) {
      // If start_date already contains time (e.g., "2025-09-01T14:25:00")
      startDateTime = new Date(startDateStr);
    } else {
      // If separate date and time fields
      startDateTime = new Date(`${startDateStr}T${startTimeStr || '00:00:00'}`);
    }
    
    if (endDateStr && endDateStr.includes('T')) {
      // If end_date already contains time (e.g., "2025-09-15T14:17:00")
      endDateTime = new Date(endDateStr);
    } else {
      // If separate date and time fields
      endDateTime = new Date(`${endDateStr}T${endTimeStr || '23:59:59'}`);
    }
    
    let assessmentStatus = 'upcoming';
    let statusMessage = '';
    
    if (now < startDateTime) {
      assessmentStatus = 'upcoming';
      statusMessage = 'This assessment has not started yet. Please review the details below:';
    } else if (now >= startDateTime && now <= endDateTime) {
      assessmentStatus = 'ongoing';
      statusMessage = 'This assessment is currently active and available for you to take. Please review the details below:';
    } else {
      assessmentStatus = 'ended';
      statusMessage = 'This assessment has ended. Please review the details below:';
    }

    const emailTitle = isReminder ? `Assessment Reminder - ${assessmentStatus.charAt(0).toUpperCase() + assessmentStatus.slice(1)}` : 'New Assessment Available';
    const emailHeader = isReminder ? `Assessment Reminder - ${assessmentStatus.charAt(0).toUpperCase() + assessmentStatus.slice(1)}` : 'New Assessment Available';
    const emailMessage = isReminder ? statusMessage : 'A new assessment has been assigned to you. Please review the details below:';

    // Format dates and times properly
    const formatDateTime = (date, time, tz) => {
      if (!date) return 'Not specified';
      
      let dateTime;
      
      // Convert date and time to strings first
      const dateStr = dateToString(date);
      const timeStr = timeToString(time);
      
      // Handle combined datetime strings (e.g., "2025-09-01T14:25:00")
      if (dateStr && dateStr.includes('T')) {
        const [datePart, timePart] = dateStr.split('T');
        const formattedTime = timePart ? timePart.substring(0, 8) : '00:00:00'; // Remove milliseconds if present
        dateTime = `${datePart} ${formattedTime}`;
      } else {
        // Handle separate date and time fields
        dateTime = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      }
      
      return tz ? `${dateTime} (${tz})` : dateTime;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isReminder ? '#f59e0b' : '#2563eb'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .assessment-details { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${isReminder ? '#f59e0b' : '#2563eb'}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .button { display: inline-block; background: ${isReminder ? '#f59e0b' : '#2563eb'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .important { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .warning { background: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .success { background: #f0fdf4; border: 1px solid #22c55e; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .assessment-title { color: ${isReminder ? '#f59e0b' : '#2563eb'}; margin-bottom: 15px; }
          .instructions { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 3px solid #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emailHeader}</h1>
          </div>
          
          <div class="content">
            <p>Hello ${recipientName},</p>
            
            <p>${emailMessage}</p>
            
            <div class="assessment-details">
              <h2 class="assessment-title">${title}</h2>
              
              ${isReminder ? `
              <div style="background: ${assessmentStatus === 'ongoing' ? '#f0fdf4' : assessmentStatus === 'ended' ? '#fef2f2' : '#fef3c7'}; border: 1px solid ${assessmentStatus === 'ongoing' ? '#22c55e' : assessmentStatus === 'ended' ? '#f87171' : '#f59e0b'}; padding: 10px; border-radius: 5px; margin-bottom: 15px; text-align: center;">
                <span style="font-weight: 600; color: ${assessmentStatus === 'ongoing' ? '#059669' : assessmentStatus === 'ended' ? '#dc2626' : '#92400e'};">
                  ${assessmentStatus === 'ongoing' ? '🟢 Assessment is Currently Active' : assessmentStatus === 'ended' ? '🔴 Assessment has Ended' : '🟡 Assessment Not Started Yet'}
                </span>
              </div>
              ` : ''}
              
              ${description ? `<p style="color: #6b7280; margin-bottom: 15px;">${description}</p>` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Assessment Name:</span>
                <span class="detail-value">${title}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Assessment Type:</span>
                <span class="detail-value">${assessmentTypeLabel}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Points:</span>
                <span class="detail-value">${total_points || 'Not specified'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Start Date & Time:</span>
                <span class="detail-value">${formatDateTime(start_date, start_time, timezone)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">End Date & Time:</span>
                <span class="detail-value">${formatDateTime(end_date, end_time, timezone)}</span>
              </div>
              
              ${duration_minutes ? `
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${duration_minutes} minutes</span>
              </div>
              ` : ''}
              
              ${max_attempts ? `
              <div class="detail-row">
                <span class="detail-label">Max Attempts:</span>
                <span class="detail-value">${max_attempts}</span>
              </div>
              ` : ''}
            </div>
            
            ${access_password ? `
            <div class="warning">
              <h3 style="margin-top: 0; color: #dc2626;">🔑 Access Password Required:</h3>
              <p style="margin-bottom: 10px; font-weight: 600;">You will need the following password to access this assessment:</p>
              <div style="background: #f3f4f6; border: 2px solid #d1d5db; padding: 15px; border-radius: 8px; text-align: center; margin: 10px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px;">${access_password}</span>
              </div>
              <p style="margin-top: 10px; margin-bottom: 0; font-size: 14px; color: #6b7280;">Please save this password - you'll need it to start the assessment.</p>
            </div>
            ` : ''}
            
            ${instructions ? `
            <div class="instructions">
              <h3 style="margin-top: 0; color: #374151;">📋 Instructions:</h3>
              <p style="margin-bottom: 0;">${instructions}</p>
            </div>
            ` : ''}
            
            <div class="important">
              <h3 style="margin-top: 0; color: #92400e;">🔒 Proctoring Information:</h3>
              <p style="margin-bottom: 0;">${proctoringInfo}</p>
            </div>
            
            ${isReminder ? `
            <div class="warning">
              <h3 style="margin-top: 0; color: #dc2626;">⚠️ Important Reminder:</h3>
              <ul style="margin-bottom: 0;">
                <li>This assessment is approaching its deadline</li>
                <li>Please complete it before the end date and time</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Contact support immediately if you encounter any issues</li>
              </ul>
            </div>
            ` : `
            <div class="success">
              <h3 style="margin-top: 0; color: #059669;">✅ Important Notes:</h3>
              <ul style="margin-bottom: 0;">
                <li>Please ensure you have a stable internet connection</li>
                <li>Complete the assessment before the end date</li>
                <li>Read all instructions carefully before starting</li>
                <li>Contact support if you encounter any technical issues</li>
              </ul>
            </div>
            `}
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/assessments" class="button">
                ${isReminder ? '🚀 Take Assessment Now' : '📝 Access Assessment'}
              </a>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from the LMS Platform.</p>
              <p>If you have any questions, please contact your instructor or support team.</p>
              <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">
                ${isReminder ? 'Reminder sent on' : 'Notification sent on'} ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getAssessmentTypeLabel(type) {
    const typeMap = {
      'quiz': 'Quiz',
      'test': 'Test',
      'exam': 'Exam',
      'assignment': 'Assignment',
      'coding_challenge': 'Coding Challenge',
      'survey': 'Survey'
    };
    return typeMap[type] || type;
  }

  // Method to get recipient emails from different assignment types
  async getRecipientEmails(assignments) {
    const emails = [];
    
    // This would typically query your database to get actual email addresses
    // For now, we'll return a placeholder structure
    
    for (const assignment of assignments) {
      switch (assignment.type) {
        case 'college':
          // Get all students in the college
          // emails.push(...await this.getCollegeStudentEmails(assignment.id));
          break;
        case 'department':
          // Get all students in the department
          // emails.push(...await this.getDepartmentStudentEmails(assignment.id));
          break;
        case 'group':
          // Get all students in the group
          // emails.push(...await this.getGroupStudentEmails(assignment.id));
          break;
        case 'student':
          // Get individual student email
          // emails.push(await this.getStudentEmail(assignment.id));
          break;
      }
    }
    
    return emails;
  }
}

export default new EmailService(); 