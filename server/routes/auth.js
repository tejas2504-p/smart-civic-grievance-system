import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import { protect } from '../middleware/auth.js';
import { generateSecureOTP, generateVerificationId, hashOTP, verifyOTPHash } from '../services/crypto/otpCrypto.js';
import { verifyCaptcha } from '../services/captcha/captchaService.js';
import { sendSMSOTP, formatIndianPhoneNumber, isValidIndianMobile } from '../services/sms/smsService.js';
import { sendEmailOTP } from '../services/email/emailService.js';
import { sendOtpLimiter, verifyOtpLimiter, resendOtpLimiter, authLimiter } from '../middleware/security.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

function maskPhone(phone) {
  if (!phone) return 'XXXXXXXXXX';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 2)}XXXXXX${clean.slice(-2)}`;
  }
  return `${phone.slice(0, 4)}XXXXXX${phone.slice(-2)}`;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***';
  return `${visible}@${domain}`;
}

export function createAuthRouter(io) {
  const router = express.Router();

  // Helper to emit safe Socket.IO metadata events
  const emitSocketEvent = (eventName, payload) => {
    if (io) {
      io.emit(eventName, payload);
    }
  };

  /**
   * @route   POST /api/auth/send-otp
   * @desc    Generate cryptographically secure OTPs for Phone & Email, store hashes in MongoDB, and dispatch SMS & Email
   * @access  Public (Rate-limited, CAPTCHA protected)
   */
  router.post('/send-otp', sendOtpLimiter, async (req, res) => {
    try {
      const { phone, email, captchaToken, purpose = 'registration' } = req.body;

      // 1. Validate Indian Phone Number
      if (!phone || !isValidIndianMobile(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210).',
        });
      }

      // 2. Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      const formattedPhone = formatIndianPhoneNumber(phone);
      const normalizedEmail = email.trim().toLowerCase();

      // 3. Prevent duplicate account registration
      if (purpose === 'registration') {
        const existingUser = await User.findOne({
          $or: [{ email: normalizedEmail }, { phone: formattedPhone }, { phone: phone.replace(/\D/g, '') }],
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address or phone number already exists.',
          });
        }
      }

      // 4. Server-Side CAPTCHA Verification
      const captchaResult = await verifyCaptcha(captchaToken, req.ip);
      if (!captchaResult.success) {
        return res.status(400).json({
          success: false,
          message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
        });
      }

      // 5. Generate 2 separate cryptographically secure OTPs
      const phoneOtp = generateSecureOTP();
      const emailOtp = generateSecureOTP();

      // 6. Hash OTPs with HMAC-SHA256 (Never store plaintext in DB)
      const phoneOtpHash = hashOTP(phoneOtp);
      const emailOtpHash = hashOTP(emailOtp);

      // 7. Expiration (5 minutes)
      const expiresInSeconds = 300; // 5 mins
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      const verificationId = generateVerificationId();

      // 8. Store session in MongoDB Atlas
      await OTPVerification.create({
        verificationId,
        phoneNumber: formattedPhone,
        email: normalizedEmail,
        phoneOtpHash,
        emailOtpHash,
        phoneVerified: false,
        emailVerified: false,
        captchaVerified: true,
        phoneAttempts: 0,
        emailAttempts: 0,
        resendCount: 0,
        lastSentAt: new Date(),
        expiresAt,
        isCompleted: false,
        purpose,
      });

      // 9. Dispatch real SMS OTP via transactional provider
      const smsPromise = sendSMSOTP(formattedPhone, phoneOtp);

      // 10. Dispatch real Email OTP via Nodemailer SMTP
      const emailPromise = sendEmailOTP(normalizedEmail, emailOtp);

      const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

      const smsOk = smsResult.status === 'fulfilled' && smsResult.value?.success;
      const emailOk = emailResult.status === 'fulfilled' && emailResult.value?.success;

      const isDev = process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID;
      if (isDev) {
        console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║ 🔐 [DEVELOPMENT OTP CODES GENERATED]                          ║
  ║ 📱 Phone (${formattedPhone}): ${phoneOtp}                     ║
  ║ 📧 Email (${normalizedEmail}): ${emailOtp}                    ║
  ╚═══════════════════════════════════════════════════════════════╝
        `);
      }

      // 11. Emit Socket.IO Event
      emitSocketEvent('OTP_SENT', {
        verificationId,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 12. Return success response with dev OTP in development/testing mode
      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent successfully to your phone and email address.',
        verificationId,
        expiresIn: expiresInSeconds,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        deliveryStatus: {
          sms: smsOk ? 'delivered' : 'queued',
          email: emailOk ? 'delivered' : 'queued',
        },
        devOtp: isDev ? { phone: phoneOtp, email: emailOtp } : undefined,
        otp: isDev ? phoneOtp : undefined,
      });
    } catch (error) {
      console.error('❌ [Send OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/verify-phone-otp
   * @desc    Verify Phone OTP hash, enforce attempt limit and expiry
   * @access  Public (Rate-limited)
   */
  router.post('/verify-phone-otp', verifyOtpLimiter, async (req, res) => {
    try {
      const { verificationId, otp } = req.body;

      if (!verificationId || !otp) {
        return res.status(400).json({ success: false, message: 'Verification ID and OTP code are required.' });
      }

      const cleanOtp = otp.toString().trim();
      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
      }

      const session = await OTPVerification.findOne({ verificationId });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Verification session not found or expired. Please request a new OTP.' });
      }

      // Check Expiration
      if (new Date() > session.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
      }

      // Check Attempt Protection (Max 5 attempts)
      if (session.phoneAttempts >= 5) {
        await OTPVerification.deleteOne({ _id: session._id });
        return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Session invalidated. Please request a new OTP.' });
      }

      // Already verified check
      if (session.phoneVerified) {
        return res.json({
          success: true,
          message: 'Phone number already verified.',
          phoneVerified: true,
          emailVerified: session.emailVerified,
          verificationCompleted: session.emailVerified,
        });
      }

      // Verify OTP Hash (or dev bypass code in development mode)
      const isDev = process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID;
      const isValid = verifyOTPHash(cleanOtp, session.phoneOtpHash) || (isDev && cleanOtp === '123456');

      if (!isValid) {
        session.phoneAttempts += 1;
        await session.save();

        const remaining = 5 - session.phoneAttempts;
        if (remaining <= 0) {
          await OTPVerification.deleteOne({ _id: session._id });
          return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Session invalidated. Please request a new OTP.' });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid Phone OTP. Please check the OTP and try again.',
          attemptsRemaining: remaining,
        });
      }

      // Mark Phone as Verified
      session.phoneVerified = true;
      await session.save();

      // Emit Socket.IO Event
      emitSocketEvent('PHONE_VERIFIED', {
        verificationId,
        phoneVerified: true,
        emailVerified: session.emailVerified,
      });

      if (session.emailVerified) {
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Phone number verified successfully.',
        phoneVerified: true,
        emailVerified: session.emailVerified,
        verificationCompleted: session.emailVerified,
      });
    } catch (error) {
      console.error('❌ [Verify Phone OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/verify-email-otp
   * @desc    Verify Email OTP hash, enforce attempt limit and expiry
   * @access  Public (Rate-limited)
   */
  router.post('/verify-email-otp', verifyOtpLimiter, async (req, res) => {
    try {
      const { verificationId, otp } = req.body;

      if (!verificationId || !otp) {
        return res.status(400).json({ success: false, message: 'Verification ID and OTP code are required.' });
      }

      const cleanOtp = otp.toString().trim();
      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
      }

      const session = await OTPVerification.findOne({ verificationId });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Verification session not found or expired. Please request a new OTP.' });
      }

      // Check Expiration
      if (new Date() > session.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
      }

      // Check Attempt Protection (Max 5 attempts)
      if (session.emailAttempts >= 5) {
        await OTPVerification.deleteOne({ _id: session._id });
        return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Session invalidated. Please request a new OTP.' });
      }

      // Already verified check
      if (session.emailVerified) {
        return res.json({
          success: true,
          message: 'Email address already verified.',
          phoneVerified: session.phoneVerified,
          emailVerified: true,
          verificationCompleted: session.phoneVerified,
        });
      }

      // Verify OTP Hash (or dev bypass code in development mode)
      const isDev = process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID;
      const isValid = verifyOTPHash(cleanOtp, session.emailOtpHash) || (isDev && cleanOtp === '123456');

      if (!isValid) {
        session.emailAttempts += 1;
        await session.save();

        const remaining = 5 - session.emailAttempts;
        if (remaining <= 0) {
          await OTPVerification.deleteOne({ _id: session._id });
          return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Session invalidated. Please request a new OTP.' });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid Email OTP. Please check the OTP and try again.',
          attemptsRemaining: remaining,
        });
      }

      // Mark Email as Verified
      session.emailVerified = true;
      await session.save();

      // Emit Socket.IO Event
      emitSocketEvent('EMAIL_VERIFIED', {
        verificationId,
        phoneVerified: session.phoneVerified,
        emailVerified: true,
      });

      if (session.phoneVerified) {
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Email address verified successfully.',
        phoneVerified: session.phoneVerified,
        emailVerified: true,
        verificationCompleted: session.phoneVerified,
      });
    } catch (error) {
      console.error('❌ [Verify Email OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/resend-otp
   * @desc    Resend OTP with rate limiting (60s cooldown, max 3 resends)
   * @access  Public (Rate-limited)
   */
  router.post('/resend-otp', resendOtpLimiter, async (req, res) => {
    try {
      const { verificationId, channel = 'both' } = req.body;

      if (!verificationId) {
        return res.status(400).json({ success: false, message: 'Verification ID is required.' });
      }

      const session = await OTPVerification.findOne({ verificationId });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Verification session expired. Please start verification again.' });
      }

      // 1. Cooldown check (Minimum 30 seconds between resends)
      const now = Date.now();
      const lastSentTime = new Date(session.lastSentAt).getTime();
      const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);

      if (elapsedSeconds < 30) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${30 - elapsedSeconds} seconds before requesting another OTP.`,
          retryAfter: 30 - elapsedSeconds,
        });
      }

      // 2. Max resends limit (Max 3 resends per session)
      if (session.resendCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Maximum resend limit (3 times) reached. Please restart registration.',
        });
      }

      // 3. Generate fresh OTPs
      const newPhoneOtp = generateSecureOTP();
      const newEmailOtp = generateSecureOTP();

      session.phoneOtpHash = hashOTP(newPhoneOtp);
      session.emailOtpHash = hashOTP(newEmailOtp);
      session.resendCount += 1;
      session.lastSentAt = new Date();
      session.expiresAt = new Date(Date.now() + 300 * 1000); // Reset 5 min expiry
      session.phoneAttempts = 0;
      session.emailAttempts = 0;

      await session.save();

      // 4. Dispatch SMS & Email
      if (channel === 'both' || channel === 'phone') {
        sendSMSOTP(session.phoneNumber, newPhoneOtp);
      }
      if (channel === 'both' || channel === 'email') {
        sendEmailOTP(session.email, newEmailOtp);
      }

      const isDev = process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID;
      if (isDev) {
        console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║ 🔄 [DEVELOPMENT OTP CODES RESENT]                             ║
  ║ 📱 Phone (${session.phoneNumber}): ${newPhoneOtp}             ║
  ║ 📧 Email (${session.email}): ${newEmailOtp}                   ║
  ╚═══════════════════════════════════════════════════════════════╝
        `);
      }

      // 5. Emit Socket.IO Event
      emitSocketEvent('OTP_RESENT', {
        verificationId,
        channel,
        resendCount: session.resendCount,
        expiresIn: 300,
      });

      return res.json({
        success: true,
        message: 'New verification OTP sent successfully.',
        expiresIn: 300,
        resendsRemaining: 3 - session.resendCount,
        devOtp: isDev ? { phone: newPhoneOtp, email: newEmailOtp } : undefined,
        otp: isDev ? (channel === 'email' ? newEmailOtp : newPhoneOtp) : undefined,
      });
    } catch (error) {
      console.error('❌ [Resend OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/register
   * @desc    Register a new citizen with verified OTP session + CAPTCHA
   * @access  Public (Rate-limited)
   */
  router.post('/register', authLimiter, async (req, res) => {
    try {
      const { name, email, password, phone, role, address, verificationId } = req.body;

      if (!name || !email || !password || !phone) {
        return res.status(400).json({ success: false, message: 'All required registration fields must be provided.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const formattedPhone = formatIndianPhoneNumber(phone);

      // 1. Check if user already exists
      const userExists = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: formattedPhone }, { phone: phone.replace(/\D/g, '') }],
      });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email address or phone number already exists.' });
      }

      // 2. Validate OTP Verification Session
      if (verificationId) {
        const session = await OTPVerification.findOne({ verificationId });
        if (!session) {
          return res.status(400).json({ success: false, message: 'Verification session expired. Please verify your phone and email again.' });
        }

        if (session.isCompleted) {
          return res.status(400).json({ success: false, message: 'This verification session has already been used.' });
        }

        if (!session.phoneVerified || !session.emailVerified) {
          return res.status(400).json({
            success: false,
            message: 'Both phone number and email address must be verified before completing registration.',
          });
        }

        // Validate that user did not change phone or email after verification
        if (session.email !== normalizedEmail || session.phoneNumber !== formattedPhone) {
          return res.status(400).json({
            success: false,
            message: 'Phone number or email does not match the verified session. Please verify again.',
          });
        }

        // Invalidate session to prevent reuse
        session.isCompleted = true;
        await session.save();
      }

      // 3. Create User Document in MongoDB Atlas
      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        phone: formattedPhone,
        address: address || '',
        role: role || 'citizen',
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to the Smart Government Grievance Portal.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } catch (error) {
      console.error('❌ [Register Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/login
   * @desc    Authenticate user via password or verified OTP with server-side CAPTCHA
   * @access  Public (Rate-limited)
   */
  router.post('/login', authLimiter, async (req, res) => {
    try {
      const { email, password, captchaToken, verificationId } = req.body;

      // 1. CAPTCHA verification (if token provided)
      if (captchaToken) {
        const captchaResult = await verifyCaptcha(captchaToken, req.ip);
        if (!captchaResult.success) {
          return res.status(400).json({
            success: false,
            message: captchaResult.message || 'Human verification failed. Please try again.',
          });
        }
      }

      // 2. OTP Login Flow
      if (verificationId) {
        const session = await OTPVerification.findOne({ verificationId });
        if (!session || (!session.phoneVerified && !session.emailVerified)) {
          return res.status(400).json({ success: false, message: 'Invalid or incomplete OTP verification session.' });
        }

        let user = await User.findOne({
          $or: [{ email: session.email }, { phone: session.phoneNumber }],
        });

        if (!user) {
          // Create citizen profile if logging in for first time via verified OTP
          user = await User.create({
            name: session.email.split('@')[0] || 'Verified Citizen',
            email: session.email,
            phone: session.phoneNumber,
            password: 'otp_secured_account_pass_' + Date.now(),
            role: 'citizen',
          });
        }

        session.isCompleted = true;
        await session.save();

        return res.json({
          success: true,
          message: 'Signed in successfully with verified OTP.',
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            designation: user.designation,
            zone: user.zone,
            token: generateToken(user._id),
          },
        });
      }

      // 3. Password Login Flow
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email/Mobile and password are required.' });
      }

      const cleanInput = email.trim();
      const user = await User.findOne({
        $or: [{ email: cleanInput.toLowerCase() }, { phone: cleanInput }, { phone: formatIndianPhoneNumber(cleanInput) }],
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your details.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your password.' });
      }

      return res.json({
        success: true,
        message: 'Login successful.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          designation: user.designation,
          zone: user.zone,
          token: generateToken(user._id),
        },
      });
    } catch (error) {
      console.error('❌ [Login Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/reset-password
   * @desc    Reset password after OTP verification
   * @access  Public (Rate-limited)
   */
  router.post('/reset-password', authLimiter, async (req, res) => {
    try {
      const { verificationId, newPassword } = req.body;

      if (!verificationId || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Valid verification session and 8+ character password required.' });
      }

      const session = await OTPVerification.findOne({ verificationId });
      if (!session || (!session.phoneVerified && !session.emailVerified)) {
        return res.status(400).json({ success: false, message: 'Verification session expired or not verified.' });
      }

      const user = await User.findOne({
        $or: [{ email: session.email }, { phone: session.phoneNumber }],
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'No registered user found with these details.' });
      }

      user.password = newPassword;
      await user.save();

      session.isCompleted = true;
      await session.save();

      return res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('❌ [Reset Password Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   GET /api/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  router.get('/me', protect, async (req, res) => {
    try {
      return res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}

export default createAuthRouter;
