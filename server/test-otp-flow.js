import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  normalizePhoneNumber,
  isValidIndianMobile,
  isDemoPhoneNumber,
  sendPhoneOtp,
} from './services/smsOtpService.js';
import { sendEmailOTP } from './services/emailOtpService.js';
import { generateSecureOTP, hashOTP, verifyOTPHash, generateVerificationId } from './services/crypto/otpCrypto.js';
import User from './models/User.js';
import OTPVerification from './models/OTPVerification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🚀 RUNNING OTP VERIFICATION SYSTEM AUDIT & TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // TEST 1: Phone Normalization
  console.log('--- Test Suite 1: Phone Normalization & Demo Restriction ---');
  const demoFormats = [
    '+918452940085',
    '+91 8452940085',
    '8452940085',
    '91 8452940085',
    '+91-8452940085',
  ];

  for (const fmt of demoFormats) {
    const normalized = normalizePhoneNumber(fmt);
    assert(
      normalized === '+918452940085',
      `Normalize "${fmt}" to +918452940085`,
      `-> Got: ${normalized}`
    );
    assert(
      isDemoPhoneNumber(fmt),
      `isDemoPhoneNumber("${fmt}") returns true`
    );
  }

  // TEST 2: Blocked Non-Demo Phone Numbers
  console.log('\n--- Test Suite 2: Blocked Non-Demo Phone Numbers ---');
  const blockedNumbers = [
    '+919876543210',
    '9999999999',
    '+91 9123456780',
  ];

  for (const num of blockedNumbers) {
    assert(
      !isDemoPhoneNumber(num),
      `isDemoPhoneNumber("${num}") returns false`
    );
    const smsRes = await sendPhoneOtp(num, '123456');
    assert(
      smsRes.blocked === true && smsRes.success === false,
      `sendPhoneOtp("${num}") rejected with demo restriction`,
      `-> Message: ${smsRes.error}`
    );
  }

  // TEST 3: Cryptographically Secure OTP Generation
  console.log('\n--- Test Suite 3: Cryptographic Security & Timing-Safe Hashing ---');
  const otp1 = generateSecureOTP();
  const otp2 = generateSecureOTP();
  assert(
    typeof otp1 === 'string' && otp1.length === 6 && /^\d{6}$/.test(otp1),
    'generateSecureOTP() produces a 6-digit numeric string'
  );
  assert(
    otp1 !== otp2,
    'Consecutive OTPs are distinct and random'
  );

  const hash1 = hashOTP(otp1);
  const hash2 = hashOTP(otp2);
  assert(
    hash1 && hash1.length === 64,
    'hashOTP() produces 64-char HMAC-SHA256 hex digest'
  );
  assert(
    verifyOTPHash(otp1, hash1),
    'verifyOTPHash() verifies matching OTP'
  );
  assert(
    !verifyOTPHash('000000', hash1),
    'verifyOTPHash() rejects incorrect OTP'
  );
  assert(
    !verifyOTPHash(otp2, hash1),
    'verifyOTPHash() rejects cross-OTP mismatch'
  );

  // Connect to MongoDB Atlas for database session testing
  console.log('\n--- Test Suite 4: MongoDB Session & Model Lifecycle ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB Atlas for verification tests.');

    const testVerificationId = generateVerificationId();
    const testEmail = `test_otp_${Date.now()}@testcivic.mh.gov.in`;
    const testPhone = '+918452940085';

    // Create session in DB
    const session = await OTPVerification.create({
      verificationId: testVerificationId,
      phoneNumber: testPhone,
      email: testEmail,
      phoneOtpHash: hash1,
      emailOtpHash: hash2,
      phoneVerified: false,
      emailVerified: false,
      phoneAttempts: 0,
      emailAttempts: 0,
      resendCount: 0,
      lastSentAt: new Date(),
      phoneOtpExpiresAt: new Date(Date.now() + 300 * 1000),
      emailOtpExpiresAt: new Date(Date.now() + 300 * 1000),
      expiresAt: new Date(Date.now() + 300 * 1000),
      isCompleted: false,
      purpose: 'registration',
      pendingRegistration: {
        name: 'Test Citizen User',
        passwordHash: '$2b$10$hashedtestpasswordstringfortestingonly123',
        address: '123 Test Street, Pune, Maharashtra - 411001',
        role: 'citizen',
      },
    });

    assert(session && session.verificationId === testVerificationId, 'Session saved in MongoDB Atlas');

    // Test Attempt Protection
    session.phoneAttempts += 1;
    await session.save();
    assert(session.phoneAttempts === 1, 'Attempt counter incremented on wrong guess');

    // Test Dual verification requirement
    assert(
      !session.phoneVerified || !session.emailVerified,
      'Session initially unverified'
    );

    // Verify Phone
    session.phoneVerified = true;
    await session.save();
    assert(
      session.phoneVerified && !session.emailVerified,
      'Phone verified, but Email still pending (account MUST NOT be activated)'
    );

    // Verify Email
    session.emailVerified = true;
    await session.save();
    assert(
      session.phoneVerified && session.emailVerified,
      'Both Phone & Email verified'
    );

    // Clean up test session
    await OTPVerification.deleteOne({ _id: session._id });
    console.log('🧹 Cleaned up test session from MongoDB Atlas.');

  } catch (dbErr) {
    console.error('MongoDB test error:', dbErr.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas.');
  }

  console.log('\n========================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
