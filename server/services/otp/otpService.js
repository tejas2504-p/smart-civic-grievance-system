import OTPVerification from '../../models/OTPVerification.js';
import { generateSecureOTP, generateVerificationId, hashOTP, verifyOTPHash } from '../crypto/otpCrypto.js';
import { checkTwilioVerifyOTP } from '../sms/smsService.js';

const EXPIRE_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES) || 5;
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30;

/**
 * Creates a new OTP verification session.
 * Generates OTPs, hashes them, stores the session, and returns the plaintext OTPs to the caller.
 */
export async function createVerificationSession(phone, email, purpose = 'registration') {
  const phoneOtp = generateSecureOTP();
  const emailOtp = generateSecureOTP();

  const phoneOtpHash = hashOTP(phoneOtp);
  const emailOtpHash = hashOTP(emailOtp);

  const expiresInSeconds = EXPIRE_MINUTES * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const verificationId = generateVerificationId();

  await OTPVerification.create({
    verificationId,
    phoneNumber: phone,
    email,
    phoneOtpHash,
    emailOtpHash,
    phoneVerified: false,
    emailVerified: false,
    captchaVerified: true, // Assuming upstream verified CAPTCHA
    phoneAttempts: 0,
    emailAttempts: 0,
    resendCount: 0,
    lastSentAt: new Date(),
    expiresAt,
    isCompleted: false,
    purpose,
  });

  return {
    verificationId,
    expiresInSeconds,
    plaintextPhoneOtp: phoneOtp,
    plaintextEmailOtp: emailOtp
  };
}

/**
 * Creates a new OTP verification session strictly for Email.
 * Generates OTP, hashes it, stores the session, and returns the plaintext OTP.
 */
export async function createEmailVerificationSession(email, purpose = 'registration') {
  const emailOtp = generateSecureOTP();
  const emailOtpHash = hashOTP(emailOtp);

  const expiresInSeconds = EXPIRE_MINUTES * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const verificationId = generateVerificationId();

  await OTPVerification.create({
    verificationId,
    phoneNumber: 'N/A', // Not applicable for email-only session
    email,
    phoneOtpHash: 'N/A', // Not applicable
    emailOtpHash,
    phoneVerified: true, // Auto-verify phone so validation doesn't block completion
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

  return {
    verificationId,
    expiresInSeconds,
    plaintextEmailOtp: emailOtp
  };
}

/**
 * Creates a new OTP verification session strictly for Phone.
 * Generates OTP, hashes it, stores the session, and returns the plaintext OTP.
 */
export async function createPhoneVerificationSession(phone, purpose = 'registration') {
  const phoneOtp = generateSecureOTP();
  const phoneOtpHash = hashOTP(phoneOtp);

  const expiresInSeconds = EXPIRE_MINUTES * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const verificationId = generateVerificationId();

  await OTPVerification.create({
    verificationId,
    phoneNumber: phone,
    email: 'N/A', // Not applicable for phone-only session
    phoneOtpHash,
    emailOtpHash: 'N/A', // Not applicable
    phoneVerified: false,
    emailVerified: true, // Auto-verify email so validation doesn't block completion
    captchaVerified: true,
    phoneAttempts: 0,
    emailAttempts: 0,
    resendCount: 0,
    lastSentAt: new Date(),
    expiresAt,
    isCompleted: false,
    purpose,
  });

  return {
    verificationId,
    expiresInSeconds,
    plaintextPhoneOtp: phoneOtp
  };
}

/**
 * Verifies an entered phone OTP against a session.
 * Handles rate limits, expiration, and lockouts.
 */
export async function verifyPhoneOTP(verificationId, enteredOtp) {
  const session = await OTPVerification.findOne({ verificationId });
  if (!session) {
    throw new Error('Verification session not found or expired. Please request a new OTP.');
  }

  if (new Date() > session.expiresAt) {
    throw new Error('OTP expired. Please request a new OTP.');
  }

  if (session.phoneAttempts >= MAX_ATTEMPTS) {
    await OTPVerification.deleteOne({ _id: session._id });
    throw new Error('Too many incorrect attempts. Session invalidated. Please request a new OTP.');
  }

  if (session.phoneVerified) {
    return {
      alreadyVerified: true,
      emailVerified: session.emailVerified
    };
  }

  const twilioResult = await checkTwilioVerifyOTP(session.phoneNumber, enteredOtp);

  if (!twilioResult.success) {
    if (twilioResult.error?.includes('credentials')) {
      throw new Error(`SMS Verification Service Error: ${twilioResult.error}`);
    }

    session.phoneAttempts += 1;
    await session.save();

    const remaining = MAX_ATTEMPTS - session.phoneAttempts;
    if (remaining <= 0) {
      await OTPVerification.deleteOne({ _id: session._id });
      throw new Error('Too many incorrect attempts. Session invalidated. Please request a new OTP.');
    }

    const err = new Error('Invalid Phone OTP. Please check the OTP and try again.');
    err.attemptsRemaining = remaining;
    throw err;
  }

  session.phoneVerified = true;
  await session.save();

  return {
    alreadyVerified: false,
    emailVerified: session.emailVerified
  };
}

/**
 * Verifies an entered email OTP against a session.
 * Handles rate limits, expiration, and lockouts.
 */
export async function verifyEmailOTP(verificationId, enteredOtp) {
  const session = await OTPVerification.findOne({ verificationId });
  if (!session) {
    throw new Error('Verification session not found or expired. Please request a new OTP.');
  }

  if (new Date() > session.expiresAt) {
    throw new Error('OTP expired. Please request a new OTP.');
  }

  if (session.emailAttempts >= MAX_ATTEMPTS) {
    await OTPVerification.deleteOne({ _id: session._id });
    throw new Error('Too many incorrect attempts. Session invalidated. Please request a new OTP.');
  }

  if (session.emailVerified) {
    return {
      alreadyVerified: true,
      phoneVerified: session.phoneVerified
    };
  }

  const isValid = verifyOTPHash(enteredOtp, session.emailOtpHash);

  if (!isValid) {
    session.emailAttempts += 1;
    await session.save();

    const remaining = MAX_ATTEMPTS - session.emailAttempts;
    if (remaining <= 0) {
      await OTPVerification.deleteOne({ _id: session._id });
      throw new Error('Too many incorrect attempts. Session invalidated. Please request a new OTP.');
    }

    const err = new Error('Invalid Email OTP. Please check the OTP and try again.');
    err.attemptsRemaining = remaining;
    throw err;
  }

  session.emailVerified = true;
  await session.save();

  return {
    alreadyVerified: false,
    phoneVerified: session.phoneVerified
  };
}

/**
 * Resends OTPs, validating cooldown periods and invalidating old OTPs.
 */
export async function resendOTPs(verificationId) {
  const session = await OTPVerification.findOne({ verificationId });
  if (!session) {
    throw new Error('Verification session expired. Please start verification again.');
  }

  const now = Date.now();
  const lastSentTime = new Date(session.lastSentAt).getTime();
  const elapsedSeconds = Math.floor((now - lastSentTime) / 1000);

  if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
    const err = new Error(`Please wait ${RESEND_COOLDOWN_SECONDS - elapsedSeconds} seconds before requesting another OTP.`);
    err.retryAfter = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    err.isCooldown = true;
    throw err;
  }

  if (session.resendCount >= 3) {
    throw new Error('Maximum resend limit (3 times) reached. Please restart registration.');
  }

  const newPhoneOtp = generateSecureOTP();
  const newEmailOtp = generateSecureOTP();

  session.phoneOtpHash = hashOTP(newPhoneOtp);
  session.emailOtpHash = hashOTP(newEmailOtp);
  session.resendCount += 1;
  session.lastSentAt = new Date();
  
  const expiresInSeconds = EXPIRE_MINUTES * 60;
  session.expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  session.phoneAttempts = 0;
  session.emailAttempts = 0;

  await session.save();

  return {
    session,
    expiresInSeconds,
    plaintextPhoneOtp: newPhoneOtp,
    plaintextEmailOtp: newEmailOtp,
    resendsRemaining: 3 - session.resendCount
  };
}
