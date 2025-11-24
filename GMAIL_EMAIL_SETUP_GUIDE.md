# Gmail Email Setup Guide for LMS Platform

This guide will help you configure Gmail SMTP for sending email notifications from your LMS Platform.

## ⚠️ Important: Gmail Security Requirements

Gmail no longer allows "less secure apps" to access your account. You **MUST** use an App Password for SMTP authentication.

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication (2FA)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in to your Gmail account
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA
5. You'll need a phone number for verification

### 2. Generate an App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app type
5. Select **Other (Custom name)** as the device
6. Enter "LMS Platform" as the name
7. Click **Generate**
8. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
9. **Important**: This password will only be shown once!

### 3. Update Your Environment Configuration

1. Open your `.env` file in the backend directory
2. Update the email configuration:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=noreply@lms-platform.com
FRONTEND_URL=http://localhost:5173
```

**Replace:**
- `your-gmail-address@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the App Password you generated (remove spaces)

### 4. Test the Configuration

1. Restart your backend server
2. Check the console logs for:
   - ✅ `Email service connection verified successfully` (success)
   - ❌ Error messages with troubleshooting steps (if failed)

## Troubleshooting

### Error: "535-5.7.8 Username and Password not accepted"

**Causes:**
- Using your regular Gmail password instead of App Password
- 2FA not enabled
- App Password not generated correctly
- Incorrect email address format

**Solutions:**
1. ✅ Ensure 2FA is enabled on your Gmail account
2. ✅ Generate a new App Password following Step 2 above
3. ✅ Use the App Password (not your regular password) in `SMTP_PASS`
4. ✅ Ensure `SMTP_USER` is your full Gmail address (e.g., `user@gmail.com`)

### Error: "Connection timeout" or "ECONNECTION"

**Causes:**
- Internet connectivity issues
- Firewall blocking SMTP port 587
- Gmail server temporarily unavailable

**Solutions:**
1. ✅ Check your internet connection
2. ✅ Ensure port 587 is not blocked by firewall
3. ✅ Try again after a few minutes

### Error: "Invalid login" or "EAUTH"

**Causes:**
- Wrong App Password
- App Password expired or revoked
- Account security settings changed

**Solutions:**
1. ✅ Generate a new App Password
2. ✅ Update `SMTP_PASS` in your `.env` file
3. ✅ Restart your backend server

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use App Passwords** instead of your main Gmail password
3. **Regularly rotate** your App Passwords
4. **Monitor** your Gmail account for suspicious activity
5. **Use a dedicated Gmail account** for your application if possible

## Alternative Email Providers

If you prefer not to use Gmail, you can use other SMTP providers:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Testing Email Functionality

After configuration, test your email setup:

1. **Create a test assessment** in your LMS
2. **Assign it to a user** with a valid email address
3. **Check the console logs** for email sending status
4. **Verify the email** was received in the user's inbox

## Support

If you continue to experience issues:

1. Check the backend console logs for detailed error messages
2. Verify your Gmail account security settings
3. Try generating a new App Password
4. Ensure your `.env` file is properly formatted
5. Restart your backend server after making changes

---

**Note**: This guide is specifically for Gmail. Other email providers may have different setup requirements.
