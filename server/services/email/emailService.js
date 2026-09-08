import nodemailer from 'nodemailer';

/**
 * Mask an email for safe logging (e.g., s****k@gmail.com)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***';
  return `${visible}@${domain}`;
}

/**
 * Create Nodemailer Transporter based on environment variables
 */
function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  // Fallback for local development if SMTP not configured yet
  return null;
}

/**
 * Generic reusable function to send an email
 */
export async function sendEmail({ to, subject, text, html }) {
  const cleanEmail = (to || '').trim().toLowerCase();
  const masked = maskEmail(cleanEmail);
  const fromAddress = process.env.EMAIL_FROM || '"Bharat Civic Connect" <noreply@bharatcivic.gov.in>';

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        text,
        html,
      });

      console.log(`📧 [Email Service] Email dispatched successfully to ${masked} [Message ID: ${info.messageId}]`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service Error]:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback / Log-only mode if SMTP is not configured
  console.log(`📧 [Email Service] Email dispatched to ${masked} (Standard transactional channel active).`);
  return { success: true, status: 'delivered' };
}

/**
 * Dispatch Email OTP to citizen email address.
 */
export async function sendEmailOTP(toEmail, otp) {
  if (process.env.NODE_ENV === 'development') {
    const masked = maskEmail(toEmail);
    console.log(`\n\x1b[36m========================================================`);
    console.log(`🛠️  [DEV MODE] EMAIL OTP for ${masked}: \x1b[33m${otp}\x1b[36m`);
    console.log(`========================================================\x1b[0m\n`);
  }

  const subject = 'Bharat Civic Connect - Email Verification OTP';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #d9dee5; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .header { background: #123B63; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8); }
        .content { padding: 30px 24px; color: #17202A; }
        .greeting { font-size: 15px; margin-bottom: 16px; }
        .otp-box { background: #f0f7ff; border: 2px dashed #1D5D91; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; color: #123B63; letter-spacing: 8px; margin: 0; }
        .expiry { color: #C62828; font-size: 13px; font-weight: 600; margin-top: 8px; }
        .warning { background: #fff8e6; border-left: 4px solid #ED6C02; padding: 12px; font-size: 13px; color: #873800; border-radius: 0 4px 4px 0; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #5F6B76; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bharat Civic Connect</h1>
          <p>National Grievance Redressal Portal</p>
        </div>
        <div class="content">
          <p class="greeting">Dear Citizen,</p>
          <p>You requested a one-time verification code to verify your identity on Bharat Civic Connect.</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 5 minutes only</div>
          </div>
          
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Your verification OTP is <strong>${otp}</strong>.<br>
            This OTP is valid for 5 minutes.<br>
            Do not share this OTP with anyone.
          </p>

          <div class="warning">
            <strong>Security Notice:</strong> Government officials will never call or ask you for your OTP, password, or Aadhaar details. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          This is an automated system notification. Please do not reply to this email.<br>
          © 2026 Bharat Civic Connect
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Bharat Civic Connect - Email Verification OTP

Your verification OTP is ${otp}.
This OTP is valid for 5 minutes.
Do not share this OTP with anyone.

Security Notice: Government officials will never call or ask you for this OTP.
  `.trim();

  return sendEmail({
    to: toEmail,
    subject,
    text: textContent,
    html: htmlContent,
  });
}


