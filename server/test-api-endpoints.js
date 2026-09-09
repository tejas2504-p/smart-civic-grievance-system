import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createAuthRouter } from './routes/auth.js';
import OTPVerification from './models/OTPVerification.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runApiTests() {
  console.log('🧪 Starting API Endpoints Integration Test...');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 Connected to MongoDB Atlas');

  const app = express();
  app.use(express.json());

  // Mock Socket.IO server for testing
  const mockIo = {
    emit: (event, payload) => {
      // Safe event logging
      console.log(`📡 [Socket.IO Event Emitted]: ${event} -> ${payload?.type || ''}`);
    },
    to: () => ({
      emit: (event, payload) => {},
    }),
  };

  app.use('/api/auth', createAuthRouter(mockIo));

  const server = app.listen(5099);

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  try {
    const baseUrl = 'http://localhost:5099/api/auth';

    // 1. Test Blocked Phone Rejection via POST /register
    console.log('\n--- API Test 1: Blocked Phone on Registration ---');
    const blockedRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Blocked User Test',
        email: 'blocked@test.gov.in',
        phone: '9999999999',
        password: 'Password123!',
        captchaToken: '1x0000000000000000000000000000000AA',
      }),
    });
    const blockedData = await blockedRes.json();
    assert(
      blockedRes.status === 400 && blockedData.message.includes('demo phone number'),
      'POST /register with non-demo phone rejects with 400 and demo restriction message',
      `Got status: ${blockedRes.status}, message: ${blockedData.message}`
    );

    // 2. Test Invalid CAPTCHA token rejection
    console.log('\n--- API Test 2: Invalid CAPTCHA on Registration ---');
    const captchaRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Captcha Test',
        email: 'captcha@test.gov.in',
        phone: '8452940085',
        password: 'Password123!',
        captchaToken: '', // Missing
      }),
    });
    const captchaData = await captchaRes.json();
    assert(
      captchaRes.status === 400,
      'POST /register with empty CAPTCHA token returns 400'
    );

    // 3. Test Incomplete OTP activation rejection
    console.log('\n--- API Test 3: Account Activation Before OTP Verification ---');
    // Create an unverified session directly in DB
    const dummySession = await OTPVerification.create({
      verificationId: 'test-session-unverified-' + Date.now(),
      phoneNumber: '+918452940085',
      email: 'unverified@test.gov.in',
      phoneOtpHash: 'dummyhash1',
      emailOtpHash: 'dummyhash2',
      phoneVerified: false,
      emailVerified: false,
      expiresAt: new Date(Date.now() + 300000),
      purpose: 'registration',
      pendingRegistration: {
        name: 'Unverified Citizen',
        passwordHash: '$2b$10$hashedtestpasswordstringfortestingonly123',
        address: 'Pune',
        role: 'citizen',
      },
    });

    const unverifiedRegisterRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: dummySession.verificationId,
      }),
    });
    const unverifiedRegisterData = await unverifiedRegisterRes.json();
    assert(
      unverifiedRegisterRes.status === 400 && unverifiedRegisterData.message.includes('Both phone number and email address must be verified'),
      'POST /register with unverified session rejected with 400',
      `Got: ${unverifiedRegisterData.message}`
    );

    // 4. Test Email verified only
    dummySession.emailVerified = true;
    await dummySession.save();

    const emailOnlyRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: dummySession.verificationId,
      }),
    });
    const emailOnlyData = await emailOnlyRes.json();
    assert(
      emailOnlyRes.status === 400 && emailOnlyData.message.includes('Both phone number and email address must be verified'),
      'Account creation rejected when only Email is verified'
    );

    // 5. Test Phone verified only
    dummySession.emailVerified = false;
    dummySession.phoneVerified = true;
    await dummySession.save();

    const phoneOnlyRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: dummySession.verificationId,
      }),
    });
    const phoneOnlyData = await phoneOnlyRes.json();
    assert(
      phoneOnlyRes.status === 400 && phoneOnlyData.message.includes('Both phone number and email address must be verified'),
      'Account creation rejected when only Phone is verified'
    );

    // 6. Test Both verified -> Activation Success!
    dummySession.emailVerified = true;
    dummySession.phoneVerified = true;
    await dummySession.save();

    const bothVerifiedRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: dummySession.verificationId,
      }),
    });
    const bothVerifiedData = await bothVerifiedRes.json();
    console.log('bothVerified response:', bothVerifiedRes.status, bothVerifiedData);
    assert(
      bothVerifiedRes.status === 201 && bothVerifiedData.success === true,
      'Account successfully created when BOTH Email and Phone are verified!'
    );
    assert(
      bothVerifiedData.data?.emailVerified === true && bothVerifiedData.data?.phoneVerified === true,
      'Final user document has emailVerified: true and phoneVerified: true'
    );

    // Clean up created test user and dummy session
    await User.deleteOne({ email: 'unverified@test.gov.in' });
    await OTPVerification.deleteOne({ _id: dummySession._id });
    console.log('🧹 Cleaned up test records');

    // 7. Test Attempt Limit on Wrong OTP
    console.log('\n--- API Test 4: Attempt Limit & Invalidation ---');
    const attemptSession = await OTPVerification.create({
      verificationId: 'test-session-attempts-' + Date.now(),
      phoneNumber: '+918452940085',
      email: 'attempts@test.gov.in',
      phoneOtpHash: 'dummyphonehash',
      emailOtpHash: 'dummyemailhash',
      phoneVerified: false,
      emailVerified: false,
      phoneAttempts: 4, // 4 attempts already made
      emailAttempts: 0,
      expiresAt: new Date(Date.now() + 300000),
      purpose: 'registration',
    });

    // 5th failed attempt should invalidate session and return 429
    const fifthAttemptRes = await fetch(`${baseUrl}/verify-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: attemptSession.verificationId,
        otp: '999999',
      }),
    });
    const fifthAttemptData = await fifthAttemptRes.json();
    assert(
      fifthAttemptRes.status === 429 && fifthAttemptData.message.includes('Too many verification attempts'),
      '5th failed verification attempt returns 429 Too Many Attempts'
    );

    const checkSessionDeleted = await OTPVerification.findOne({ verificationId: attemptSession.verificationId });
    assert(
      checkSessionDeleted === null,
      'Session was invalidated and deleted from database after 5 failed attempts'
    );

    // 8. Test Resend Cooldown
    console.log('\n--- API Test 5: Resend Cooldown Protection ---');
    const cooldownSession = await OTPVerification.create({
      verificationId: 'test-session-cooldown-' + Date.now(),
      phoneNumber: '+918452940085',
      email: 'cooldown@test.gov.in',
      phoneOtpHash: 'dummyhash',
      emailOtpHash: 'dummyhash',
      lastSentAt: new Date(), // Sent right now
      expiresAt: new Date(Date.now() + 300000),
      purpose: 'registration',
    });

    const resendRes = await fetch(`${baseUrl}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: cooldownSession.verificationId,
      }),
    });
    const resendData = await resendRes.json();
    assert(
      resendRes.status === 429 && resendData.message.includes('wait'),
      'Resend within cooldown returns 429 "Please wait before requesting another OTP."',
      `Got: ${resendData.message}`
    );

    await OTPVerification.deleteOne({ _id: cooldownSession._id });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas.');
  }

  console.log('\n========================================================');
  console.log(`📊 API TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiTests();
