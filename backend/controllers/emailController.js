import emailService from '../services/emailService.js';

// Check email service configuration
export const checkEmailConfiguration = async (req, res) => {
  try {
    const isConfigured = emailService.isConfigured;
    const hasTransporter = !!emailService.transporter;
    
    res.json({
      success: true,
      data: {
        isConfigured,
        hasTransporter,
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT || 587,
        smtpUser: process.env.SMTP_USER ? 'Configured' : 'Not configured',
        smtpPass: process.env.SMTP_PASS ? 'Configured' : 'Not configured',
        smtpFrom: process.env.SMTP_FROM || 'noreply@lms-platform.com'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check email configuration'
    });
  }
};

// Test email service
export const testEmailService = async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }
    
    if (!emailService.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Email service is not configured. Please set SMTP_USER and SMTP_PASS environment variables.'
      });
    }
    
    // Send a test email
    const testResult = await emailService.sendAssessmentNotification(
      [{ email: testEmail, name: 'Test User' }],
      {
        title: 'Test Assessment',
        type: 'test',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'This is a test email to verify email service configuration.',
        total_points: 100
      }
    );
    
    if (testResult.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: testResult.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to test email service'
    });
  }
}; 