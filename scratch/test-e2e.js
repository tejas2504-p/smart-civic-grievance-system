import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../server/models/User.js';
import OTPVerification from '../server/models/OTPVerification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api/auth';

async function request(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { status: res.status, data: await res.json() };
}

async function runE2ETests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- Cleaning up E2E Test Data ---');
  await User.deleteMany({ email: 'test.e2e@example.com' });
  await OTPVerification.deleteMany({ email: 'test.e2e@example.com' });

  console.log('\n--- 1/2/14/15. Testing /send-otp ---');
  
  // Test 14: Invalid Turnstile
  let res = await request('/send-otp', {
    phone: '9876543210',
    email: 'test.e2e@example.com',
    captchaToken: 'INVALID_TOKEN'
  });
  if (res.status === 400 && res.data.message.includes('CAPTCHA')) {
    console.log('✅ PASS: Invalid Turnstile caught.');
  } else {
    console.error('❌ FAIL: Invalid Turnstile', res);
  }

  // Test 2: Both OTPs sent
  res = await request('/send-otp', {
    phone: '8888888888',
    email: 'test.e2e@example.com',
    captchaToken: '1x00000000000000000000AA' // Bypass token
  });
  
  if (res.status === 200 && res.data.verificationId) {
    console.log('✅ PASS: Both OTPs sent successfully.');
  } else {
    console.error('❌ FAIL: Both OTPs sent', res);
    process.exit(1);
  }

  const vId = res.data.verificationId;
  
  // Need to extract plaintext OTPs from DB to test verification since they were sent to real/mock providers
  const session = await OTPVerification.findOne({ verificationId: vId });
  // Since we hashed them, we can't get plaintext easily unless we overwrite them, or mock the crypto.
  // Wait, I can just overwrite the hash in DB with a known hash for "123456"
  const { hashOTP } = await import('../server/services/crypto/otpCrypto.js');
  const knownHash = hashOTP('123456');
  session.phoneOtpHash = knownHash;
  session.emailOtpHash = knownHash;
  await session.save();

  console.log('\n--- 3/7/9. Testing /verify-phone-otp ---');
  
  // Test 7: Wrong OTP
  res = await request('/verify-phone-otp', { verificationId: vId, otp: '654321' });
  if (res.status === 400 && res.data.message.includes('Invalid')) {
    console.log('✅ PASS: Wrong OTP caught.');
  } else {
    console.error('❌ FAIL: Wrong OTP', res);
  }

  // Test 3: Phone verification
  res = await request('/verify-phone-otp', { verificationId: vId, otp: '123456' });
  if (res.status === 200 && res.data.phoneVerified) {
    console.log('✅ PASS: Phone verification successful.');
  } else {
    console.error('❌ FAIL: Phone verification', res);
  }

  console.log('\n--- 4/5. Testing /verify-email-otp ---');
  res = await request('/verify-email-otp', { verificationId: vId, otp: '123456' });
  if (res.status === 200 && res.data.emailVerified && res.data.verificationCompleted) {
    console.log('✅ PASS: Email verification successful and both verified flag set.');
  } else {
    console.error('❌ FAIL: Email verification', res);
  }

  console.log('\n--- 6. Testing /register ---');
  res = await request('/register', {
    name: 'E2E Tester',
    email: 'test.e2e@example.com',
    phone: '8888888888',
    password: 'Password123!',
    address: '123 Test St',
    role: 'citizen',
    verificationId: vId
  });
  if (res.status === 200 && res.data.data.token) {
    console.log('✅ PASS: Registration completed successfully.');
  } else {
    console.error('❌ FAIL: Registration', res);
  }

  // Test 15: Duplicate Registration
  res = await request('/register', {
    name: 'E2E Tester 2',
    email: 'test.e2e@example.com',
    phone: '8888888889',
    password: 'Password123!',
    address: '123 Test St',
    role: 'citizen',
    verificationId: vId // Session already used, but also duplicate email
  });
  if (res.status === 400 && res.data.message.includes('already exists')) {
    console.log('✅ PASS: Duplicate registration blocked.');
  } else {
    console.error('❌ FAIL: Duplicate registration', res);
  }

  console.log('\n--- Cleaning up E2E Test Data ---');
  await User.deleteMany({ email: 'test.e2e@example.com' });
  await OTPVerification.deleteMany({ email: 'test.e2e@example.com' });
  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

runE2ETests();
