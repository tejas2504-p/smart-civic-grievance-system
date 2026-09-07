import crypto from 'crypto';

/**
 * Generate a 6-digit cryptographically secure OTP string.
 * Uses Node.js crypto.randomInt (not Math.random()).
 */
export function generateSecureOTP() {
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
}

/**
 * Generate a random UUID v4 for the verification session.
 */
export function generateVerificationId() {
  return crypto.randomUUID();
}

/**
 * Hash an OTP using HMAC-SHA256 with a secret salt.
 * Plaintext OTPs are never stored in the database.
 */
export function hashOTP(otp, secretKey = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'gov_portal_otp_secret_key_2026') {
  if (!otp || typeof otp !== 'string') return '';
  return crypto.createHmac('sha256', secretKey).update(otp.trim()).digest('hex');
}

/**
 * Timing-safe verification of an entered OTP against the stored hash.
 */
export function verifyOTPHash(enteredOtp, storedHash, secretKey = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'gov_portal_otp_secret_key_2026') {
  if (!enteredOtp || !storedHash) return false;
  const computedHash = hashOTP(enteredOtp, secretKey);
  
  try {
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}
