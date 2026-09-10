import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import { protect } from '../middleware/auth.js';
import { generateSecureOTP, generateVerificationId, hashOTP, verifyOTPHash } from '../services/crypto/otpCrypto.js';
import { verifyCaptcha, generateCivicCaptcha } from '../services/captcha/captchaService.js';
import {
  sendPhoneOtp,
  normalizePhoneNumber,
  isValidIndianMobile,
  maskPhone,
  isDemoPhoneNumber,
} from '../services/smsOtpService.js';
import { sendEmailOTP } from '../services/emailOtpService.js';
import { sendOtpLimiter, verifyOtpLimiter, resendOtpLimiter, authLimiter } from '../middleware/security.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const visible = local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***';
  return `${visible}@${domain}`;
}

export function createAuthRouter(io) {
  const router = express.Router();

  // Helper to emit safe Socket.IO metadata events (NO OTP DIGITS EVER EMITTED)
  const emitSocketEvent = (eventName, payload) => {
    if (io) {
      io.emit(eventName, payload);
      if (payload?.verificationId) {
        io.to(`verify_${payload.verificationId}`).emit(eventName, payload);
      }
    }
  };

  /**
   * @route   GET /api/auth/captcha
   * @desc    Generate a fresh Civic Security Code CAPTCHA challenge
   * @access  Public
   */
  router.get('/captcha', (req, res) => {
    try {
      const captchaData = generateCivicCaptcha();
      return res.json({ success: true, ...captchaData });
    } catch (err) {
      console.error('Error generating captcha:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate security code' });
    }
  });

  /**
   * @route   POST /api/auth/send-otp
   * @desc    Generate cryptographically secure OTPs for Phone & Email, store hashes in MongoDB, and dispatch SMS & Email
   * @access  Public (Rate-limited, CAPTCHA protected)
   */
  router.post('/send-otp', sendOtpLimiter, async (req, res) => {
    try {
      const { phone, email, channel, captchaToken, purpose = 'registration' } = req.body;

      // =========================================================================
      // FLOW 1: LOGIN WITH OTP (Single-Channel: Email OR Phone)
      // =========================================================================
      if (purpose === 'login') {
        const targetChannel = channel || (email && !phone ? 'email' : 'phone');

        // 1. Server-Side CAPTCHA Verification (Strict Enforcement)
        const captchaResult = await verifyCaptcha(captchaToken, req.ip);
        if (!captchaResult.success) {
          return res.status(400).json({
            success: false,
            message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
          });
        }

        const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
        const expiresInSeconds = expiryMinutes * 60;
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
        const verificationId = generateVerificationId();

        // 2A: Email OTP Login Flow
        if (targetChannel === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
          }

          const normalizedEmail = email.trim().toLowerCase();

          // USER LOOKUP: Account MUST exist in MongoDB
          const existingUser = await User.findOne({ email: normalizedEmail });
          if (!existingUser) {
            return res.status(404).json({
              success: false,
              message: 'No account found with this email address. Please register first.',
            });
          }

          // Generate secure OTP
          const emailOtp = generateSecureOTP();
          const emailOtpHash = hashOTP(emailOtp);

          // Dispatch real Email OTP via configured email provider (Resend)
          const emailResult = await sendEmailOTP(normalizedEmail, emailOtp);
          if (!emailResult?.success) {
            return res.status(500).json({
              success: false,
              message: emailResult?.error || "We couldn't send the email verification code. Please try again.",
            });
          }

          // Store session in MongoDB Atlas
          await OTPVerification.create({
            verificationId,
            email: normalizedEmail,
            emailOtpHash,
            channel: 'email',
            phoneVerified: false,
            emailVerified: false,
            captchaVerified: true,
            emailAttempts: 0,
            resendCount: 0,
            lastSentAt: new Date(),
            emailOtpExpiresAt: expiresAt,
            expiresAt,
            isCompleted: false,
            purpose: 'login',
          });

          emitSocketEvent('otp:email-sent', {
            type: 'otp:email-sent',
            verificationId,
            emailMasked: maskEmail(normalizedEmail),
            expiresIn: expiresInSeconds,
            timestamp: Date.now(),
          });

          return res.status(200).json({
            success: true,
            message: 'Verification OTP sent to your email address.',
            channel: 'email',
            verificationId,
            expiresIn: expiresInSeconds,
            emailMasked: maskEmail(normalizedEmail),
            ...(emailResult?.isDevSimulated || process.env.OTP_DEMO_MODE !== 'false' ? { devOtp: emailOtp, devEmailOtp: emailOtp } : {}),
          });
        }

        // 2B: Phone OTP Login Flow
        if (targetChannel === 'phone' || targetChannel === 'mobile') {
          if (!phone || !isValidIndianMobile(phone)) {
            return res.status(400).json({
              success: false,
              message: 'Please provide a valid 10-digit Indian mobile number (e.g. 8452940085).',
            });
          }

          const formattedPhone = normalizePhoneNumber(phone);
          const rawDigits = formattedPhone.replace(/\D/g, '');

          // Demo Mode phone restriction
          const isDemoMode = process.env.OTP_DEMO_MODE !== 'false';
          if (isDemoMode && !isDemoPhoneNumber(formattedPhone)) {
            return res.status(400).json({
              success: false,
              message: 'SMS OTP verification is currently available only for the demo phone number.',
            });
          }

          // USER LOOKUP: Account MUST exist in MongoDB
          const existingUser = await User.findOne({
            $or: [
              { phone: formattedPhone },
              { phone: rawDigits },
              { phone: rawDigits.slice(-10) },
              { phone: `+91${rawDigits.slice(-10)}` },
            ],
          });

          if (!existingUser) {
            return res.status(404).json({
              success: false,
              message: 'No account found with this phone number. Please register first.',
            });
          }

          // Generate secure OTP
          const phoneOtp = generateSecureOTP();

          // Dispatch real SMS OTP via configured SMS provider
          const smsResult = await sendPhoneOtp(formattedPhone, phoneOtp);
          if (!smsResult?.success) {
            return res.status(500).json({
              success: false,
              message: smsResult?.error || "We couldn't send the SMS verification code. Please try again.",
            });
          }

          const actualPhoneOtp = smsResult.deliveredOtp || phoneOtp;
          const phoneOtpHash = hashOTP(actualPhoneOtp);

          // Store session in MongoDB Atlas
          await OTPVerification.create({
            verificationId,
            phoneNumber: formattedPhone,
            phoneOtpHash,
            channel: 'phone',
            phoneVerified: false,
            emailVerified: false,
            captchaVerified: true,
            phoneAttempts: 0,
            resendCount: 0,
            lastSentAt: new Date(),
            phoneOtpExpiresAt: expiresAt,
            expiresAt,
            isCompleted: false,
            purpose: 'login',
          });

          emitSocketEvent('otp:sms-sent', {
            type: 'otp:sms-sent',
            verificationId,
            phoneMasked: maskPhone(formattedPhone),
            expiresIn: expiresInSeconds,
            timestamp: Date.now(),
          });

          return res.status(200).json({
            success: true,
            message: 'Verification OTP sent to your phone number.',
            channel: 'phone',
            verificationId,
            expiresIn: expiresInSeconds,
            phoneMasked: maskPhone(formattedPhone),
          });
        }
      }

      // =========================================================================
      // FLOW 2: REGISTRATION (Dual-Channel: BOTH Phone and Email OTP)
      // =========================================================================

      // 1. Validate Indian Phone Number
      if (!phone || !isValidIndianMobile(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number (e.g. 8452940085).',
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

      const formattedPhone = normalizePhoneNumber(phone);
      const normalizedEmail = email.trim().toLowerCase();

      // 3. Demo Phone Number Restriction (Backend Security Enforcement)
      const isDemoMode = process.env.OTP_DEMO_MODE !== 'false';
      if (isDemoMode && !isDemoPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'SMS OTP verification is currently available only for the demo phone number.',
        });
      }

      // 4. Prevent duplicate account registration
      const existingUser = await User.findOne({
        $or: [
          { email: normalizedEmail },
          ...(isDemoMode && isDemoPhoneNumber(formattedPhone) ? [] : [{ phone: formattedPhone }, { phone: phone.replace(/\D/g, '') }]),
        ],
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address or phone number already exists.',
        });
      }

      // 5. Server-Side CAPTCHA Verification
      const captchaResult = await verifyCaptcha(captchaToken, req.ip);
      if (!captchaResult.success) {
        return res.status(400).json({
          success: false,
          message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
        });
      }

      // 6. Generate 2 separate cryptographically secure 6-digit OTPs
      const phoneOtp = generateSecureOTP();
      const emailOtp = generateSecureOTP();

      // 7. Dispatch real SMS OTP and Email OTP concurrently
      const smsPromise = sendPhoneOtp(formattedPhone, phoneOtp);
      const emailPromise = sendEmailOTP(normalizedEmail, emailOtp);

      const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

      const smsOk = smsResult.status === 'fulfilled' && smsResult.value?.success;
      const emailOk = emailResult.status === 'fulfilled' && emailResult.value?.success;

      // Handle delivery failures gracefully without mock fallbacks
      if (!emailOk && !smsOk) {
        return res.status(500).json({
          success: false,
          message: "We couldn't send the verification codes. Please try again.",
        });
      }
      if (!emailOk) {
        return res.status(500).json({
          success: false,
          message: "We couldn't send the email verification code. Please try again.",
        });
      }
      if (!smsOk) {
        return res.status(500).json({
          success: false,
          message: smsResult.value?.error || "We couldn't send the SMS verification code. Please try again.",
        });
      }

      // If provider used a template with delivered OTP (e.g. Twilio trial), hash the delivered code
      const actualPhoneOtp = smsResult.value?.deliveredOtp || phoneOtp;
      const phoneOtpHash = hashOTP(actualPhoneOtp);
      const emailOtpHash = hashOTP(emailOtp);

      // 8. Expiration (5 minutes by default)
      const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
      const expiresInSeconds = expiryMinutes * 60;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      const verificationId = generateVerificationId();

      // 9. Store session in MongoDB Atlas
      await OTPVerification.create({
        verificationId,
        phoneNumber: formattedPhone,
        email: normalizedEmail,
        phoneOtpHash,
        emailOtpHash,
        channel: 'both',
        phoneVerified: false,
        emailVerified: false,
        captchaVerified: true,
        phoneAttempts: 0,
        emailAttempts: 0,
        resendCount: 0,
        lastSentAt: new Date(),
        phoneOtpExpiresAt: expiresAt,
        emailOtpExpiresAt: expiresAt,
        expiresAt,
        isCompleted: false,
        purpose: 'registration',
      });

      // 12. Emit Safe Socket.IO Events (NO OTP DIGITS EXPOSED)
      emitSocketEvent('otp:email-sent', {
        type: 'otp:email-sent',
        verificationId,
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      emitSocketEvent('otp:sms-sent', {
        type: 'otp:sms-sent',
        verificationId,
        phoneMasked: maskPhone(formattedPhone),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      emitSocketEvent('OTP_SENT', {
        verificationId,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 13. Return success response (with dev hint in development/demo mode)
      return res.status(200).json({
        success: true,
        message: 'Verification OTPs have been sent.',
        emailVerificationRequired: true,
        phoneVerificationRequired: true,
        verificationId,
        expiresIn: expiresInSeconds,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        ...(emailResult.value?.isDevSimulated || process.env.OTP_DEMO_MODE !== 'false' ? { devEmailOtp: emailOtp } : {}),
        deliveryStatus: {
          sms: 'delivered',
          email: 'delivered',
        },
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

      // Check Expiration (5 minutes)
      const expiry = session.phoneOtpExpiresAt || session.expiresAt;
      if (new Date() > expiry) {
        return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new code.' });
      }

      // Check Attempt Protection (Max 5 attempts)
      const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
      if (session.phoneAttempts >= maxAttempts) {
        await OTPVerification.deleteOne({ _id: session._id });
        return res.status(429).json({ success: false, message: 'Too many verification attempts. Please request a new OTP.' });
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

      // Verify OTP Hash securely (timing-safe comparison against HMAC-SHA256 hash)
      const isValid = verifyOTPHash(cleanOtp, session.phoneOtpHash);

      if (!isValid) {
        session.phoneAttempts += 1;
        await session.save();

        const remaining = maxAttempts - session.phoneAttempts;
        if (remaining <= 0) {
          await OTPVerification.deleteOne({ _id: session._id });
          return res.status(429).json({ success: false, message: 'Too many verification attempts. Please request a new OTP.' });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid verification code.',
          attemptsRemaining: remaining,
        });
      }

      // Mark Phone as Verified
      session.phoneVerified = true;
      await session.save();

      // Emit Safe Socket.IO Events
      emitSocketEvent('otp:phone-verified', {
        type: 'otp:phone-verified',
        verificationId,
        verified: true,
      });

      emitSocketEvent('PHONE_VERIFIED', {
        verificationId,
        phoneVerified: true,
        emailVerified: session.emailVerified,
      });

      if (session.emailVerified) {
        emitSocketEvent('otp:verification-complete', {
          type: 'otp:verification-complete',
          verificationId,
          verified: true,
        });
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Phone verified successfully.',
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

      // Check Expiration (5 minutes)
      const expiry = session.emailOtpExpiresAt || session.expiresAt;
      if (new Date() > expiry) {
        return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new code.' });
      }

      // Check Attempt Protection (Max 5 attempts)
      const maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
      if (session.emailAttempts >= maxAttempts) {
        await OTPVerification.deleteOne({ _id: session._id });
        return res.status(429).json({ success: false, message: 'Too many verification attempts. Please request a new OTP.' });
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

      // Verify OTP Hash securely (timing-safe comparison against HMAC-SHA256 hash)
      const isValid = verifyOTPHash(cleanOtp, session.emailOtpHash);

      if (!isValid) {
        session.emailAttempts += 1;
        await session.save();

        const remaining = maxAttempts - session.emailAttempts;
        if (remaining <= 0) {
          await OTPVerification.deleteOne({ _id: session._id });
          return res.status(429).json({ success: false, message: 'Too many verification attempts. Please request a new OTP.' });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid verification code.',
          attemptsRemaining: remaining,
        });
      }

      // Mark Email as Verified
      session.emailVerified = true;
      await session.save();

      // Emit Safe Socket.IO Events
      emitSocketEvent('otp:email-verified', {
        type: 'otp:email-verified',
        verificationId,
        verified: true,
      });

      emitSocketEvent('EMAIL_VERIFIED', {
        verificationId,
        phoneVerified: session.phoneVerified,
        emailVerified: true,
      });

      if (session.phoneVerified) {
        emitSocketEvent('otp:verification-complete', {
          type: 'otp:verification-complete',
          verificationId,
          verified: true,
        });
        emitSocketEvent('VERIFICATION_COMPLETED', {
          verificationId,
          status: 'ready_for_registration',
        });
      }

      return res.json({
        success: true,
        message: 'Email verified successfully.',
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
   * @desc    Resend OTP with rate limiting (60s cooldown, max 5 resends)
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

      // 1. Cooldown check (Minimum 60 seconds between resends)
      const cooldownSeconds = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;
      const now = Date.now();
      const lastSentTime = new Date(session.lastSentAt).getTime();
      const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);

      if (elapsedSeconds < cooldownSeconds) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting another OTP.',
          retryAfter: cooldownSeconds - elapsedSeconds,
        });
      }

      // 2. Max resends limit (Configurable, default 5 sends)
      const maxSends = Number(process.env.OTP_MAX_SENDS) || 5;
      if (session.resendCount >= maxSends) {
        return res.status(429).json({
          success: false,
          message: 'Maximum resend limit reached. Please restart registration.',
        });
      }

      // 3. Generate fresh cryptographically secure OTPs
      const newPhoneOtp = generateSecureOTP();
      const newEmailOtp = generateSecureOTP();
      const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
      const newExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      session.phoneOtpHash = hashOTP(newPhoneOtp);
      session.emailOtpHash = hashOTP(newEmailOtp);
      session.resendCount += 1;
      session.lastSentAt = new Date();
      session.expiresAt = newExpiresAt;
      session.phoneOtpExpiresAt = newExpiresAt;
      session.emailOtpExpiresAt = newExpiresAt;
      session.phoneAttempts = 0;
      session.emailAttempts = 0;

      // 4. Dispatch SMS & Email according to session channel
      let smsResult, emailResult;
      const targetChannel = session.channel || channel || 'both';

      if ((targetChannel === 'both' || targetChannel === 'phone') && session.phoneNumber) {
        smsResult = await sendPhoneOtp(session.phoneNumber, newPhoneOtp);
        if (smsResult?.success && smsResult.deliveredOtp && smsResult.deliveredOtp !== newPhoneOtp) {
          session.phoneOtpHash = hashOTP(smsResult.deliveredOtp);
        }
      }
      if ((targetChannel === 'both' || targetChannel === 'email') && session.email) {
        emailResult = await sendEmailOTP(session.email, newEmailOtp);
      }
      await session.save();

      // 5. Emit Safe Socket.IO Events (NO OTP DIGITS EXPOSED)
      if (session.email) {
        emitSocketEvent('otp:email-sent', {
          type: 'otp:email-sent',
          verificationId,
          emailMasked: maskEmail(session.email),
          expiresIn: expiryMinutes * 60,
          timestamp: Date.now(),
        });
      }

      if (session.phoneNumber) {
        emitSocketEvent('otp:sms-sent', {
          type: 'otp:sms-sent',
          verificationId,
          phoneMasked: maskPhone(session.phoneNumber),
          expiresIn: expiryMinutes * 60,
          timestamp: Date.now(),
        });
      }

      emitSocketEvent('OTP_RESENT', {
        verificationId,
        channel: targetChannel,
        resendCount: session.resendCount,
        expiresIn: expiryMinutes * 60,
      });

      return res.json({
        success: true,
        message: 'New verification OTP sent successfully.',
        expiresIn: expiryMinutes * 60,
        resendsRemaining: maxSends - session.resendCount,
        ...(emailResult?.isDevSimulated || process.env.OTP_DEMO_MODE !== 'false' ? { devEmailOtp: newEmailOtp } : {}),
      });
    } catch (error) {
      console.error('❌ [Resend OTP Error]:', error.message);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  });

  /**
   * @route   POST /api/auth/register
   * @desc    Register a new citizen: Initiates pending registration or finalizes after dual OTP verification
   * @access  Public (Rate-limited)
   */
  router.post('/register', authLimiter, async (req, res) => {
    try {
      const { name, email, password, phone, role, address, verificationId, captchaToken } = req.body;

      // =========================================================================
      // FLOW A: Final Account Creation (User provides verificationId after verifying OTPs)
      // =========================================================================
      if (verificationId) {
        const session = await OTPVerification.findOne({ verificationId });
        if (!session) {
          return res.status(400).json({
            success: false,
            message: 'Verification session expired. Please verify your phone and email again.',
          });
        }

        if (session.isCompleted) {
          return res.status(400).json({
            success: false,
            message: 'This verification session has already been used.',
          });
        }

        // BACKEND ENFORCEMENT: Final account ONLY created when BOTH email and phone are verified
        if (!session.phoneVerified || !session.emailVerified) {
          return res.status(400).json({
            success: false,
            message: 'Both phone number and email address must be verified before completing registration.',
          });
        }

        // Determine user attributes from session or payload
        const finalName = name || session.pendingRegistration?.name;
        const finalEmail = session.email;
        const finalPhone = session.phoneNumber;
        const finalAddress = address || session.pendingRegistration?.address || '';
        const finalRole = role || session.pendingRegistration?.role || 'citizen';
        const finalPassword = session.pendingRegistration?.passwordHash || (password ? await bcrypt.hash(password, 10) : undefined);

        if (!finalName || !finalPassword) {
          return res.status(400).json({
            success: false,
            message: 'Missing user registration details. Please restart registration.',
          });
        }

        // Ensure user doesn't already exist
        const isDemoMode = process.env.OTP_DEMO_MODE !== 'false';
        const alreadyExists = await User.findOne({
          $or: [
            { email: finalEmail },
            ...(isDemoMode && isDemoPhoneNumber(finalPhone) ? [] : [{ phone: finalPhone }]),
          ],
        });
        if (alreadyExists) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address or phone number already exists.',
          });
        }

        // Create permanent user account in MongoDB Atlas
        const user = await User.create({
          name: finalName,
          email: finalEmail,
          password: finalPassword,
          phone: finalPhone,
          address: finalAddress,
          role: finalRole,
          emailVerified: true,
          phoneVerified: true,
        });

        // Invalidate session to prevent reuse
        session.isCompleted = true;
        await session.save();

        emitSocketEvent('otp:verification-complete', {
          type: 'otp:verification-complete',
          verificationId,
          verified: true,
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
            emailVerified: true,
            phoneVerified: true,
            token: generateToken(user._id),
          },
        });
      }

      // =========================================================================
      // FLOW B: Initial Registration Submission (Validates details, sends dual OTPs)
      // =========================================================================
      if (!name || !email || !password || !phone) {
        return res.status(400).json({ success: false, message: 'All required registration fields must be provided.' });
      }

      const formattedPhone = normalizePhoneNumber(phone);
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Validate Indian Mobile
      if (!isValidIndianMobile(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number (e.g. 8452940085).',
        });
      }

      // 2. Validate Email format
      const emailRegex = /^[^\s@]+@[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      // 3. Demo Phone Number Restriction (Backend Security Enforcement)
      const isDemoMode = process.env.OTP_DEMO_MODE !== 'false';
      if (isDemoMode && !isDemoPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'SMS OTP verification is currently available only for the demo phone number.',
        });
      }

      // 4. Check whether email or phone already belongs to a registered account
      const userExists = await User.findOne({
        $or: [
          { email: normalizedEmail },
          ...(isDemoMode && isDemoPhoneNumber(formattedPhone) ? [] : [{ phone: formattedPhone }, { phone: phone.replace(/\D/g, '') }]),
        ],
      });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address or phone number already exists.',
        });
      }

      // 5. Server-Side CAPTCHA Verification
      const captchaResult = await verifyCaptcha(captchaToken, req.ip);
      if (!captchaResult.success) {
        return res.status(400).json({
          success: false,
          message: captchaResult.message || 'Human verification (CAPTCHA) failed. Please try again.',
        });
      }

      // 6. Generate cryptographically secure OTPs
      const phoneOtp = generateSecureOTP();
      const emailOtp = generateSecureOTP();

      // 7. Hash password with bcrypt before saving into pending registration
      const passwordHash = await bcrypt.hash(password, 10);

      // 8. Dispatch SMS OTP & Email OTP concurrently
      const smsPromise = sendPhoneOtp(formattedPhone, phoneOtp);
      const emailPromise = sendEmailOTP(normalizedEmail, emailOtp);

      const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

      const smsOk = smsResult.status === 'fulfilled' && smsResult.value?.success;
      const emailOk = emailResult.status === 'fulfilled' && emailResult.value?.success;

      if (!emailOk && !smsOk) {
        return res.status(500).json({
          success: false,
          message: "We couldn't send the verification codes. Please try again.",
        });
      }
      if (!emailOk) {
        return res.status(500).json({
          success: false,
          message: "We couldn't send the email verification code. Please try again.",
        });
      }
      if (!smsOk) {
        return res.status(500).json({
          success: false,
          message: smsResult.value?.error || "We couldn't send the SMS verification code. Please try again.",
        });
      }

      // If provider delivered a specific template code (e.g. Twilio trial), hash the delivered code!
      const actualPhoneOtp = smsResult.value?.deliveredOtp || phoneOtp;
      const phoneOtpHash = hashOTP(actualPhoneOtp);
      const emailOtpHash = hashOTP(emailOtp);

      // 9. Temporary Pending Registration Record in MongoDB
      const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
      const expiresInSeconds = expiryMinutes * 60;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      const newVerificationId = generateVerificationId();

      await OTPVerification.create({
        verificationId: newVerificationId,
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
        phoneOtpExpiresAt: expiresAt,
        emailOtpExpiresAt: expiresAt,
        expiresAt,
        isCompleted: false,
        purpose: 'registration',
        pendingRegistration: {
          name,
          passwordHash,
          address: address || '',
          role: role || 'citizen',
        },
      });

      // 12. Emit Safe Socket.IO Events
      emitSocketEvent('otp:email-sent', {
        type: 'otp:email-sent',
        verificationId: newVerificationId,
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      emitSocketEvent('otp:sms-sent', {
        type: 'otp:sms-sent',
        verificationId: newVerificationId,
        phoneMasked: maskPhone(formattedPhone),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      emitSocketEvent('OTP_SENT', {
        verificationId: newVerificationId,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        expiresIn: expiresInSeconds,
        timestamp: Date.now(),
      });

      // 13. Safe Response (with dev hint in development/demo mode)
      return res.status(200).json({
        success: true,
        message: 'Verification OTPs have been sent.',
        emailVerificationRequired: true,
        phoneVerificationRequired: true,
        verificationId: newVerificationId,
        expiresIn: expiresInSeconds,
        phoneMasked: maskPhone(formattedPhone),
        emailMasked: maskEmail(normalizedEmail),
        ...(emailResult.value?.isDevSimulated || process.env.OTP_DEMO_MODE !== 'false' ? { devEmailOtp: emailOtp } : {}),
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
        if (!session) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP verification session.' });
        }

        if (session.isCompleted) {
          return res.status(400).json({ success: false, message: 'This OTP verification has already been used.' });
        }

        if (!session.phoneVerified && !session.emailVerified) {
          return res.status(400).json({ success: false, message: 'Please verify the OTP code before completing login.' });
        }

        // Identify existing user by verified channel
        let user = null;
        if (session.channel === 'email' || (session.email && session.emailVerified)) {
          user = await User.findOne({ email: session.email.toLowerCase().trim() });
        } else if (session.channel === 'phone' || (session.phoneNumber && session.phoneVerified)) {
          const rawPhone = session.phoneNumber.replace(/\D/g, '');
          user = await User.findOne({
            $or: [
              { phone: session.phoneNumber },
              { phone: rawPhone },
              { phone: `+91${rawPhone.slice(-10)}` },
              { phone: rawPhone.slice(-10) },
            ],
          });
        } else {
          user = await User.findOne({
            $or: [{ email: session.email }, { phone: session.phoneNumber }],
          });
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: session.channel === 'email'
              ? 'No registered account found with this email address. Please register first.'
              : 'No registered account found with this phone number. Please register first.',
          });
        }

        // Delete / invalidate session to prevent replay
        await OTPVerification.deleteOne({ _id: session._id });

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
        $or: [{ email: cleanInput.toLowerCase() }, { phone: cleanInput }, { phone: normalizePhoneNumber(cleanInput) }],
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
