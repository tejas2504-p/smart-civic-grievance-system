import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import { protect } from '../middleware/auth.js';
import { createVerificationSession, createEmailVerificationSession, createPhoneVerificationSession, verifyPhoneOTP, verifyEmailOTP, resendOTPs } from '../services/otp/otpService.js';
import AuditLog from '../models/AuditLog.js';
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

      // 5. Generate secure OTPs and store session via OTP Service
      const sessionData = await createVerificationSession(formattedPhone, normalizedEmail, purpose);
      const { verificationId, expiresInSeconds, plaintextPhoneOtp, plaintextEmailOtp } = sessionData;

      // 6. Dispatch real SMS OTP via transactional provider
      const smsPromise = sendSMSOTP(formattedPhone, plaintextPhoneOtp);

      // 7. Dispatch real Email OTP via Nodemailer SMTP
      const emailPromise = sendEmailOTP(normalizedEmail, plaintextEmailOtp);

      const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

      const smsOk = smsResult.status === 'fulfilled' && smsResult.value?.success;
      const emailOk = emailResult.status === 'fulfilled' && emailResult.value?.success;

      // 11. Emit Safe Socket.IO Event (NO OTP DIGITS EXPOSED)
      emitSocketEvent('OTP_SENT', {
        verificationId,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 12. Return generic success response (NO OTP IN RESPONSE)
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
      });
    } catch (error) {
      console.error('❌ [Send OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/send-email-otp
   * @desc    Generate cryptographically secure OTP for Email only, store hash in MongoDB, and dispatch Email
   * @access  Public (Rate-limited, CAPTCHA protected)
   */
  router.post('/send-email-otp', sendOtpLimiter, async (req, res) => {
    try {
      const { email, captchaToken, purpose = 'registration' } = req.body;

      // 1. Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 2. Prevent duplicate account registration
      if (purpose === 'registration') {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.',
          });
        }
      }

      // 3. Server-Side CAPTCHA Verification
      if (captchaToken) {
        const captchaResult = await verifyCaptcha(captchaToken, req.ip);
        if (!captchaResult.success) {
          return res.status(400).json({
            success: false,
            message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
          });
        }
      }

      // 4. Generate secure OTPs and store session via OTP Service
      const sessionData = await createEmailVerificationSession(normalizedEmail, purpose);
      const { verificationId, expiresInSeconds, plaintextEmailOtp } = sessionData;

      // 5. Dispatch real Email OTP via Nodemailer SMTP
      // We don't await this directly to prevent the request from hanging if SMTP is slow,
      // but we wait for it so we can log failures. If we want to return immediately, we can use Promise.allSettled.
      const emailResult = await Promise.allSettled([sendEmailOTP(normalizedEmail, plaintextEmailOtp)]);
      
      const emailOk = emailResult[0].status === 'fulfilled' && emailResult[0].value?.success;

      // 6. Emit Safe Socket.IO Event (NO OTP DIGITS EXPOSED)
      emitSocketEvent('EMAIL_OTP_SENT', {
        verificationId,
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 7. Return generic success response (NO OTP IN RESPONSE)
      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent successfully to your email address.',
        verificationId,
        expiresIn: expiresInSeconds,
        emailMasked: maskEmail(normalizedEmail),
        deliveryStatus: {
          email: emailOk ? 'delivered' : 'queued',
        },
      });
    } catch (error) {
      console.error('❌ [Send Email OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/send-phone-otp
   * @desc    Generate cryptographically secure OTP for Phone only, store hash in MongoDB, and dispatch SMS
   * @access  Public (Rate-limited, CAPTCHA protected)
   */
  router.post('/send-phone-otp', sendOtpLimiter, async (req, res) => {
    try {
      const { phone, captchaToken, purpose = 'registration' } = req.body;

      // 1. Validate Phone
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number.',
        });
      }

      if (!isValidIndianMobile(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number.',
        });
      }

      const formattedPhone = formatIndianPhoneNumber(phone);

      // 2. Prevent duplicate account registration
      if (purpose === 'registration') {
        const existingUser = await User.findOne({
          $or: [{ phone: formattedPhone }, { phone: phone.replace(/\D/g, '') }],
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'An account with this phone number already exists.',
          });
        }
      }

      // 3. Server-Side CAPTCHA Verification
      if (captchaToken) {
        const captchaResult = await verifyCaptcha(captchaToken, req.ip);
        if (!captchaResult.success) {
          return res.status(400).json({
            success: false,
            message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
          });
        }
      }

      // 4. Generate secure OTPs and store session via OTP Service
      const sessionData = await createPhoneVerificationSession(formattedPhone, purpose);
      const { verificationId, expiresInSeconds, plaintextPhoneOtp } = sessionData;

      // 5. Dispatch real SMS OTP via Provider (Twilio/Fast2SMS/MSG91)
      const smsResult = await Promise.allSettled([sendSMSOTP(formattedPhone, plaintextPhoneOtp)]);
      
      const smsOk = smsResult[0].status === 'fulfilled' && smsResult[0].value?.success;

      // 6. Emit Safe Socket.IO Event (NO OTP DIGITS EXPOSED)
      emitSocketEvent('PHONE_OTP_SENT', {
        verificationId,
        phoneMasked: maskPhone(formattedPhone),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 7. Return generic success response (NO OTP IN RESPONSE)
      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent successfully to your phone number.',
        verificationId,
        expiresIn: expiresInSeconds,
        phoneMasked: maskPhone(formattedPhone),
        deliveryStatus: {
          sms: smsOk ? 'delivered' : 'queued',
        },
      });
    } catch (error) {
      console.error('❌ [Send Phone OTP Error]:', error.message);
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

      let verificationResult;
      try {
        verificationResult = await verifyPhoneOTP(verificationId, cleanOtp);
      } catch (err) {
        if (err.message.includes('Too many incorrect attempts')) {
          return res.status(429).json({ success: false, message: err.message });
        }
        if (err.message.includes('expired') || err.message.includes('not found')) {
          return res.status(404).json({ success: false, message: err.message });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
          attemptsRemaining: err.attemptsRemaining,
        });
      }

      // Already verified check
      if (verificationResult.alreadyVerified) {
        return res.json({
          success: true,
          message: 'Phone number already verified.',
          phoneVerified: true,
          emailVerified: verificationResult.emailVerified,
          verificationCompleted: verificationResult.emailVerified,
        });
      }

      // Emit Safe Socket.IO Event
      emitSocketEvent('PHONE_VERIFIED', {
        verificationId,
        phoneVerified: true,
        emailVerified: verificationResult.emailVerified,
      });

      if (verificationResult.emailVerified) {
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Phone number verified successfully.',
        phoneVerified: true,
        emailVerified: verificationResult.emailVerified,
        verificationCompleted: verificationResult.emailVerified,
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

      let verificationResult;
      try {
        verificationResult = await verifyEmailOTP(verificationId, cleanOtp);
      } catch (err) {
        if (err.message.includes('Too many incorrect attempts')) {
          return res.status(429).json({ success: false, message: err.message });
        }
        if (err.message.includes('expired') || err.message.includes('not found')) {
          return res.status(404).json({ success: false, message: err.message });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
          attemptsRemaining: err.attemptsRemaining,
        });
      }

      // Already verified check
      if (verificationResult.alreadyVerified) {
        return res.json({
          success: true,
          message: 'Email address already verified.',
          phoneVerified: verificationResult.phoneVerified,
          emailVerified: true,
          verificationCompleted: verificationResult.phoneVerified,
        });
      }

      // Emit Safe Socket.IO Event
      emitSocketEvent('EMAIL_VERIFIED', {
        verificationId,
        phoneVerified: verificationResult.phoneVerified,
        emailVerified: true,
      });

      if (verificationResult.phoneVerified) {
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Email address verified successfully.',
        phoneVerified: verificationResult.phoneVerified,
        emailVerified: true,
        verificationCompleted: verificationResult.phoneVerified,
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

      let resendResult;
      try {
        resendResult = await resendOTPs(verificationId);
      } catch (err) {
        if (err.isCooldown) {
          return res.status(429).json({
            success: false,
            message: err.message,
            retryAfter: err.retryAfter,
          });
        }
        if (err.message.includes('Maximum resend limit')) {
          return res.status(429).json({ success: false, message: err.message });
        }
        return res.status(404).json({ success: false, message: err.message });
      }

      const { session, expiresInSeconds, plaintextPhoneOtp, plaintextEmailOtp, resendsRemaining } = resendResult;

      // 4. Dispatch SMS & Email
      if (channel === 'both' || channel === 'phone') {
        sendSMSOTP(session.phoneNumber, plaintextPhoneOtp);
      }
      if (channel === 'both' || channel === 'email') {
        sendEmailOTP(session.email, plaintextEmailOtp);
      }

      // 5. Emit Safe Socket.IO Event (NO OTP DIGITS EXPOSED)
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
      if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof phone !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid data format provided.' });
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

      // Create Audit Log
      await AuditLog.create({
        action: 'REGISTER_SUCCESS',
        entity: 'User',
        entityId: user._id.toString(),
        performedBy: user.email,
        role: user.role,
        ipAddress: req.ip,
        details: { phone: user.phone, verificationId: verificationId || 'None' }
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

      if (email && typeof email !== 'string') return res.status(400).json({ success: false, message: 'Invalid email format' });
      if (password && typeof password !== 'string') return res.status(400).json({ success: false, message: 'Invalid password format' });

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

        // Create Audit Log
        await AuditLog.create({
          action: 'LOGIN_SUCCESS',
          entity: 'User',
          entityId: user._id.toString(),
          performedBy: user.email,
          role: user.role,
          ipAddress: req.ip,
          details: { method: 'otp' }
        });

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

      // Create Audit Log
      await AuditLog.create({
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user._id.toString(),
        performedBy: user.email,
        role: user.role,
        ipAddress: req.ip,
        details: { method: 'password' }
      });

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
