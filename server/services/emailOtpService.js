import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Mask email for safe logging (e.g., s****k@gmail.com)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***';
  return `${visible}@${domain}`;
}

/**
 * Dispatch Real Email OTP using Nodemailer SMTP (e.g. Gmail) or Resend SDK
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit cryptographically generated OTP
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, isDevSimulated?: boolean, deliveredOtp?: string, devEmailOtp?: string}>}
 */
export async function sendEmailOTP(toEmail, otp) {
  const cleanEmail = (toEmail || '').trim().toLowerCase();
  const masked = maskEmail(cleanEmail);
  const isDevOrDemo = process.env.NODE_ENV !== 'production' || process.env.OTP_DEMO_MODE !== 'false';

  const subject = 'Verify your email address - Government Grievance Portal';

  const textBody = `
Government of Maharashtra - Smart Grievance Redressal Portal

Your verification code is:
${otp}

This OTP will expire in 5 minutes.
Do not share this code with anyone.

Security Warning: Government officials will never ask you for your verification code or password.
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: #0b1a2e; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #93c5fd; }
    .body { padding: 32px 28px; }
    .intro { font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #334155; }
    .otp-container { background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
    .otp-code { font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 10px; margin: 0; font-family: 'Courier New', Courier, monospace; }
    .expiry { color: #dc2626; font-size: 13px; font-weight: 600; margin-top: 10px; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 24px; font-size: 13px; color: #92400e; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Government of Maharashtra</h1>
      <p>Smart Grievance Redressal Portal</p>
    </div>
    <div class="body">
      <p class="intro">
        <strong>Dear Citizen,</strong><br>
        You have initiated citizen registration on the Smart Government Grievance Portal. Please use the verification code below to verify your email address.
      </p>

      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">This OTP will expire in 5 minutes.</div>
      </div>

      <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
        Do not share this code with anyone.
      </p>

      <div class="warning-box">
        <strong>Security Warning:</strong> Portal officers will NEVER ask you for your OTP, password, or Aadhaar credentials via phone, SMS, or email.
      </div>
    </div>
    <div class="footer">
      This is an automated system verification message. Please do not reply.<br>
      © 2026 Smart Government Grievance Portal · Government of Maharashtra
    </div>
  </div>
</body>
</html>
  `.trim();

  // 1. Try Nodemailer SMTP (configured in .env via SMTP_USER/SMTP_HOST)
  if (process.env.SMTP_USER && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        },
      });

      const fromAddress = process.env.EMAIL_FROM || `"Government Grievance Portal" <${process.env.SMTP_USER}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`📧 [Nodemailer SMTP] Verification OTP dispatched successfully to ${masked} [ID: ${info.messageId}]`);
      console.log(`🔑 [Email OTP for ${cleanEmail}]: ${otp}`);
      return {
        success: true,
        deliveredOtp: otp,
        devEmailOtp: otp,
        messageId: info.messageId,
      };
    } catch (smtpErr) {
      console.error(`❌ [Nodemailer SMTP Error]: ${smtpErr.message}`);
      if (isDevOrDemo) {
        console.log(`ℹ️ [Email Service] Demo mode active: Falling back to simulated delivery for ${masked} (OTP: ${otp})`);
        return {
          success: true,
          deliveredOtp: otp,
          isDevSimulated: true,
          devEmailOtp: otp,
          messageId: 'dev_smtp_fallback_' + Date.now(),
        };
      }
      return {
        success: false,
        error: "We couldn't send the email verification code. Please check your email configuration.",
      };
    }
  }

  // 2. Try Resend if RESEND_API_KEY is configured
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = (process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();

      const response = await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      if (response.error) {
        console.error(`❌ [Resend Email Error]: ${response.error.message || JSON.stringify(response.error)}`);
        if (isDevOrDemo) {
          console.log(`ℹ️ [Email Service] Demo mode active: Falling back to simulated delivery for ${masked} (OTP: ${otp})`);
          return {
            success: true,
            deliveredOtp: otp,
            isDevSimulated: true,
            devEmailOtp: otp,
            messageId: 'dev_resend_fallback_' + Date.now(),
          };
        }
        return {
          success: false,
          error: response.error.message || "We couldn't send the email verification code. Please try again.",
        };
      }

      console.log(`📧 [Resend Email Service] Verification OTP email dispatched successfully to ${masked} [ID: ${response.data?.id || 'sent'}]`);
      console.log(`🔑 [Email OTP for ${cleanEmail}]: ${otp}`);
      return {
        success: true,
        deliveredOtp: otp,
        devEmailOtp: otp,
        messageId: response.data?.id,
      };
    } catch (resendErr) {
      console.error(`❌ [Resend Exception]: ${resendErr.message}`);
      if (isDevOrDemo) {
        console.log(`ℹ️ [Email Service] Demo mode active: Falling back to simulated delivery for ${masked} (OTP: ${otp})`);
        return {
          success: true,
          deliveredOtp: otp,
          isDevSimulated: true,
          devEmailOtp: otp,
          messageId: 'dev_resend_exception_' + Date.now(),
        };
      }
      return {
        success: false,
        error: "We couldn't send the email verification code. Please try again.",
      };
    }
  }

  // 3. Fallback for Dev/Demo if no provider configured
  if (isDevOrDemo) {
    console.log(`
  ===================================================================
  📧 [DEV / DEMO MODE EMAIL OTP (No Provider Configured)]
  To: ${cleanEmail}
  🔑 OTP Verification Code: ${otp}
  💡 Enter code [ ${otp} ] in the web portal to verify.
  ===================================================================
    `);
    return {
      success: true,
      deliveredOtp: otp,
      isDevSimulated: true,
      devEmailOtp: otp,
      messageId: 'dev_simulated_' + Date.now(),
    };
  }

  console.error('❌ [Email Service] No email provider configured (Neither SMTP nor RESEND_API_KEY).');
  return {
    success: false,
    error: "We couldn't send the email verification code. Please try again.",
  };
}

export default { sendEmailOTP };
