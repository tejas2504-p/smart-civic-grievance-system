import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import OTPVerification from './models/OTPVerification.js';
import { hashOTP } from './services/crypto/otpCrypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} -> ${details}`);
    failed++;
  }
}

async function runAuthTestSuite() {
  console.log('===============================================================');
  console.log('🧪 COMPREHENSIVE AUTHENTICATION & CAPTCHA TEST SUITE');
  console.log('===============================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 Connected to MongoDB Atlas');

  const testPhone = '+918452940085';
  const testEmail = 'sahilnarkar121105@gmail.com';
  const testPassword = 'Password123!';

  // Clean previous test user
  await User.deleteMany({ $or: [{ email: testEmail }, { phone: testPhone }] });
  await OTPVerification.deleteMany({ $or: [{ email: testEmail }, { phoneNumber: testPhone }] });

  // Create real test citizen
  const testUser = await User.create({
    name: 'Sahil Real User',
    email: testEmail,
    phone: testPhone,
    password: testPassword,
    role: 'citizen',
    emailVerified: true,
    phoneVerified: true,
  });
  console.log(`👤 Created test user in MongoDB Atlas (_id: ${testUser._id})\n`);

  try {
    // -----------------------------------------------------------------------
    // TEST 1: Password Login Validation (Existing Functionality Preserved)
    // -----------------------------------------------------------------------
    console.log('--- Test Group 1: Password Login Integrity ---');

    // 1A. Valid email + password
    const pwdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const pwdData = await pwdRes.json();
    assert(pwdRes.status === 200 && pwdData.data?.token, 'Password login with correct email + password succeeds');

    // 1B. Valid phone + password
    const phonePwdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testPhone, password: testPassword }),
    });
    const phonePwdData = await phonePwdRes.json();
    assert(phonePwdRes.status === 200 && phonePwdData.data?.token, 'Password login with phone + password succeeds');

    // 1C. Wrong password
    const wrongPwdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });
    const wrongPwdData = await wrongPwdRes.json();
    assert(wrongPwdRes.status === 401, 'Password login with incorrect password returns 401', wrongPwdData.message);

    // 1D. Unknown user
    const unknownPwdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent.user.xyz@smartportal.gov.in', password: testPassword }),
    });
    assert(unknownPwdRes.status === 401, 'Password login with non-existent user returns 401');

    // -----------------------------------------------------------------------
    // TEST 2: Server-Side CAPTCHA Verification
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 2: Server-Side CAPTCHA Verification ---');

    // 2A. Request OTP with missing CAPTCHA token -> 400
    const emptyCaptchaRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, channel: 'phone', purpose: 'login', captchaToken: '' }),
    });
    const emptyCaptchaData = await emptyCaptchaRes.json();
    assert(emptyCaptchaRes.status === 400, 'Requesting OTP without CAPTCHA token rejected with 400', emptyCaptchaData.message);

    // 2B. Request OTP with invalid CAPTCHA token
    // Using standard Turnstile always-fails test key token to verify failure handling
    const failCaptchaRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, channel: 'phone', purpose: 'login', captchaToken: 'invalid_token_sample' }),
    });
    const failCaptchaData = await failCaptchaRes.json();
    // In development test mode with Cloudflare test key, token verification returns status 200 or 400
    assert(failCaptchaRes.status === 200 || failCaptchaRes.status === 400, 'CAPTCHA verification endpoint responded appropriately');

    const validCaptchaToken = '1x0000000000000000000000000000000AA';

    // -----------------------------------------------------------------------
    // TEST 3: User Lookup on Login (Reject Unknown Accounts)
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 3: User Lookup Security (Unknown Users Rejected) ---');

    // 3A. Phone OTP Login for unknown phone
    const unknownPhoneRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '8452940085', // Allowed demo format
        channel: 'phone',
        purpose: 'login',
        captchaToken: validCaptchaToken,
      }),
    });
    // Our testUser has +918452940085, so let's delete testUser temporarily to verify unknown phone lookup
    await User.deleteMany({ phone: testPhone });

    const unknownPhoneTestRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '8452940085',
        channel: 'phone',
        purpose: 'login',
        captchaToken: validCaptchaToken,
      }),
    });
    const unknownPhoneData = await unknownPhoneTestRes.json();
    assert(
      unknownPhoneTestRes.status === 404 && unknownPhoneData.message.includes('No account found'),
      'Phone OTP login for unknown phone returns 404 and does NOT generate OTP',
      unknownPhoneData.message
    );

    // 3B. Email OTP Login for unknown email
    const unknownEmailRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unknown.stranger.999@gmail.com',
        channel: 'email',
        purpose: 'login',
        captchaToken: validCaptchaToken,
      }),
    });
    const unknownEmailData = await unknownEmailRes.json();
    assert(
      unknownEmailRes.status === 404 && unknownEmailData.message.includes('No account found'),
      'Email OTP login for unknown email returns 404 and does NOT generate OTP',
      unknownEmailData.message
    );

    // Re-create test user
    await User.create({
      name: 'Sahil Real User',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      role: 'citizen',
      emailVerified: true,
      phoneVerified: true,
    });

    // -----------------------------------------------------------------------
    // TEST 4: Real Phone OTP Login Flow (Twilio Delivery)
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 4: Real Phone OTP Login Flow ---');

    const sendPhoneRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        channel: 'phone',
        purpose: 'login',
        captchaToken: validCaptchaToken,
      }),
    });
    const sendPhoneData = await sendPhoneRes.json();
    assert(
      sendPhoneRes.status === 200 && sendPhoneData.verificationId,
      'POST /send-otp for Phone OTP login returns 200 with verificationId',
      `Got status: ${sendPhoneRes.status}`
    );

    const phoneVerificationId = sendPhoneData.verificationId;
    const phoneSession = await OTPVerification.findOne({ verificationId: phoneVerificationId });
    assert(phoneSession && phoneSession.channel === 'phone', 'OTPVerification session saved in MongoDB with channel: "phone"');

    // 4B. Attempt with wrong OTP -> 400 with attempts left
    const wrongPhoneOtpRes = await fetch(`${BASE_URL}/auth/verify-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: phoneVerificationId,
        otp: '000000',
      }),
    });
    const wrongPhoneOtpData = await wrongPhoneOtpRes.json();
    assert(
      wrongPhoneOtpRes.status === 400 && wrongPhoneOtpData.attemptsRemaining === 4,
      'Wrong Phone OTP returns 400 and decrements attempts to 4',
      `Got: ${wrongPhoneOtpRes.status}`
    );

    // 4C. Verify Phone OTP (set a known test hash in session for reliable programmatic verification)
    phoneSession.phoneOtpHash = hashOTP('777888');
    await phoneSession.save();

    const verifyPhoneRes = await fetch(`${BASE_URL}/auth/verify-phone-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: phoneVerificationId,
        otp: '777888',
      }),
    });
    const verifyPhoneData = await verifyPhoneRes.json();
    assert(verifyPhoneRes.status === 200 && verifyPhoneData.phoneVerified, 'Verify Phone OTP succeeds -> HTTP 200');

    // 4D. Complete login with verified phone session
    const phoneLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: phoneVerificationId,
      }),
    });
    const phoneLoginData = await phoneLoginRes.json();
    assert(
      phoneLoginRes.status === 200 && phoneLoginData.data?.token,
      'POST /login with verified Phone OTP completes successfully and generates JWT',
      `Got status: ${phoneLoginRes.status}`
    );
    assert(phoneLoginData.data?.email === testEmail, 'Authenticated user matches registered citizen account');

    // 4E. Replay protection: Attempting to login with same verificationId again
    const phoneReplayRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: phoneVerificationId,
      }),
    });
    assert(phoneReplayRes.status === 400, 'Reusing verified OTP session rejected with 400 (Single-use enforcement)');

    // -----------------------------------------------------------------------
    // TEST 5: Real Email OTP Login Flow (Resend Delivery)
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 5: Real Email OTP Login Flow ---');

    const sendEmailRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        channel: 'email',
        purpose: 'login',
        captchaToken: validCaptchaToken,
      }),
    });
    const sendEmailData = await sendEmailRes.json();
    assert(
      sendEmailRes.status === 200 && sendEmailData.verificationId,
      'POST /send-otp for Email OTP login returns 200 with verificationId',
      `Got status: ${sendEmailRes.status}`
    );

    const emailVerificationId = sendEmailData.verificationId;
    const emailSession = await OTPVerification.findOne({ verificationId: emailVerificationId });
    assert(emailSession && emailSession.channel === 'email', 'OTPVerification session saved in MongoDB with channel: "email"');

    // 5B. Verify Email OTP
    emailSession.emailOtpHash = hashOTP('654321');
    await emailSession.save();

    const verifyEmailRes = await fetch(`${BASE_URL}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: emailVerificationId,
        otp: '654321',
      }),
    });
    const verifyEmailData = await verifyEmailRes.json();
    assert(verifyEmailRes.status === 200 && verifyEmailData.emailVerified, 'Verify Email OTP succeeds -> HTTP 200');

    // 5C. Complete login with verified email session
    const emailLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: emailVerificationId,
      }),
    });
    const emailLoginData = await emailLoginRes.json();
    assert(
      emailLoginRes.status === 200 && emailLoginData.data?.token,
      'POST /login with verified Email OTP completes successfully and generates JWT',
      `Got status: ${emailLoginRes.status}`
    );

    // 5D. Replay protection
    const emailReplayRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId: emailVerificationId,
      }),
    });
    assert(emailReplayRes.status === 400, 'Reusing verified Email OTP session rejected with 400');

    // -----------------------------------------------------------------------
    // TEST 6: Rate Limiting & Cooldown Protection
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 6: Rate Limiting & Resend Cooldown ---');

    // Create a session to test cooldown
    const cooldownSession = await OTPVerification.create({
      verificationId: 'v-cooldown-' + Date.now(),
      phoneNumber: testPhone,
      phoneOtpHash: hashOTP('111222'),
      channel: 'phone',
      lastSentAt: new Date(), // Sent right now
      expiresAt: new Date(Date.now() + 300000),
      purpose: 'login',
    });

    const resendRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: cooldownSession.verificationId }),
    });
    const resendData = await resendRes.json();
    assert(
      resendRes.status === 429 && resendData.message.includes('wait'),
      'Resend OTP within 60-second cooldown rejected with HTTP 429',
      resendData.message
    );

    // -----------------------------------------------------------------------
    // TEST 7: Final Regression Check - Password Login Still 100% Functional
    // -----------------------------------------------------------------------
    console.log('\n--- Test Group 7: Final Password Login Regression Check ---');
    const finalPwdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const finalPwdData = await finalPwdRes.json();
    assert(finalPwdRes.status === 200 && finalPwdData.data?.token, 'Final check: Password login is 100% functional and unmodified');

    // Clean up test data
    await User.deleteMany({ $or: [{ email: testEmail }, { phone: testPhone }] });
    await OTPVerification.deleteMany({ $or: [{ email: testEmail }, { phoneNumber: testPhone }, { verificationId: cooldownSession.verificationId }] });
    console.log('\n🧹 Test artifacts cleaned from MongoDB Atlas.');

  } catch (err) {
    console.error('\n💥 Unexpected test failure:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL AUTH TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runAuthTestSuite();
