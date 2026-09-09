import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAuthRouter } from '../../server/routes/auth.js';
import User from '../../server/models/User.js';
import OTPVerification from '../../server/models/OTPVerification.js';
import { connectDB } from '../../server/config/db.js';

// Setup Express mock app
const app = express();
app.use(express.json());
// Mock Socket.io for auth router
const mockIo = { emit: () => {} };
app.use('/api/auth', createAuthRouter(mockIo));

describe('Auth & OTP Security Integration Tests', () => {
  let testUserToken;
  let testUserId;
  let verificationId;

  it('should prevent NoSQL injection on login endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: { $gt: "" }, password: 'password123' });
    
    // We expect 400 Bad Request or 401 Unauthorized, not a crash or a successful login
    expect([400, 401, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('should successfully dispatch an OTP, generate a session, and reject invalid verification', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '8888888888', email: 'test@example.com', context: 'login', captchaToken: 'test-turnstile-token' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verificationId).toBeDefined();
    
    verificationId = res.body.verificationId;
    
    const otpDoc = await OTPVerification.findOne({ verificationId });
    expect(otpDoc).not.toBeNull();
    expect(otpDoc.phoneOtpHash).toBeDefined();
    
    // Now test invalid verification
    const verifyRes = await request(app)
      .post('/api/auth/verify-phone-otp')
      .send({ verificationId, otp: '000000' });
      
    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.message).toMatch(/Invalid/i);
  });

  it('should limit OTP sends (Rate Limiter Test)', async () => {
    // Generate too many requests
    for(let i=0; i<6; i++) {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9999999999', email: 'test@example.com', context: 'registration', captchaToken: 'test-turnstile-token' });
    }
    
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9999999999', context: 'registration' });
    
    // Express-rate-limit should bounce it
    expect(res.status).toBe(429);
  });
});
