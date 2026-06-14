const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize and verify email transporter
 * Call this once at app startup
 */
const initializeEmailService = async () => {
  // Validate environment variables
  if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER not set in .env file');
    return false;
  }
  if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS not set in .env file');
    console.log('   For Gmail / Outlook / Hotmail: Use an App Password (not your regular password)');
    console.log('   1. Enable 2-Factor Authentication on your email account');
    console.log('   2. Generate an App Password in your account security settings');
    console.log('   3. Copy it to EMAIL_PASS in your .env file');
    return false;
  }

  try {
    const transportConfig = {
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: {
        maxConnections: 1,
        maxMessages: 5,
        rateDelta: 20000, // 20 seconds
        rateLimit: 5, // 5 messages per rateDelta
      },
    };

    if (process.env.EMAIL_HOST) {
      transportConfig.host = process.env.EMAIL_HOST;
      transportConfig.port = parseInt(process.env.EMAIL_PORT || '587', 10);
      transportConfig.secure = process.env.EMAIL_SECURE === 'true'; // true for port 465, false for 587/other
    } else if (process.env.EMAIL_SERVICE) {
      transportConfig.service = process.env.EMAIL_SERVICE;
    } else {
      const emailLower = process.env.EMAIL_USER.toLowerCase();
      if (
        emailLower.endsWith('@outlook.com') ||
        emailLower.endsWith('@hotmail.com') ||
        emailLower.endsWith('@live.com') ||
        emailLower.endsWith('@office365.com')
      ) {
        transportConfig.host = 'smtp.office365.com';
        transportConfig.port = 587;
        transportConfig.secure = false; // TLS
      } else {
        // Default to Gmail
        transportConfig.service = 'gmail';
      }
    }

    transporter = nodemailer.createTransport(transportConfig);

    // Verify connection
    const verified = await transporter.verify();
    if (verified) {
      console.log('✅ Email service initialized successfully');
      console.log(`   Using: ${process.env.EMAIL_USER}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Verify EMAIL_USER is correct');
    console.log('   2. Use an App Password (not your regular password)');
    console.log('   3. Enable 2-Factor Authentication first');
    console.log('   4. Check security settings in your email provider (e.g. Gmail / Outlook)');
    return false;
  }
};

/**
 * Send email with proper error handling
 */
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.error('❌ Email service not initialized. Call initializeEmailService() first');
    throw new Error('Email service not initialized');
  }

  if (!to || !subject || !html) {
    throw new Error('Missing required email parameters: to, subject, html');
  }

  try {
    const fromName = process.env.EMAIL_FROM_NAME;
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const from = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    // Provide specific error guidance
    if (error.message.includes('Invalid login')) {
      console.log('\n⚠️  Invalid login credentials:');
      console.log('   1. Check EMAIL_USER is correct');
      console.log('   2. Use App Password (not Gmail password)');
      console.log('   3. Enable 2FA on Gmail account first');
    } else if (error.message.includes('EAUTH')) {
      console.log('\n⚠️  Authentication failed:');
      console.log('   Try creating a new App Password');
    }
    
    throw error;
  }
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (to, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
        <p style="color: #666; margin-bottom: 20px;">Your verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 32px; font-weight: bold; color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</p>
        </div>
        <p style="color: #999; font-size: 12px;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, 'Email Verification Code', html);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset</h2>
        <p style="color: #666; margin-bottom: 20px;">Your password reset code is:</p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 32px; font-weight: bold; color: #dc3545; margin: 0; letter-spacing: 5px;">${otp}</p>
        </div>
        <p style="color: #999; font-size: 12px;">This code will expire in 15 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, 'Password Reset Code', html);
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  getTransporter: () => transporter,
};
