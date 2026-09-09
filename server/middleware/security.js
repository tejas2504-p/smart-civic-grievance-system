import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Helmet Security Headers Configuration
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for API or allow API cross-origin
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

/**
 * Rate Limiter for Sending OTP (prevents spamming SMS/Email gateways)
 * Limit: 100 requests in development/test, 5 in production per 15 minutes per IP
 */
export const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP address. Please wait 15 minutes before requesting again.',
    retryAfter: 900,
  },
});

/**
 * Rate Limiter for Resending OTP
 * Limit: 3 resend attempts per 15 minutes per IP
 */
export const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Maximum OTP resend limit reached. Please wait 15 minutes.',
    retryAfter: 900,
  },
});

/**
 * Rate Limiter for OTP Verification (protects against brute-force attacks)
 * Limit: 15 verification attempts per 15 minutes per IP
 */
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait before trying again.',
  },
});

/**
 * General Authentication Rate Limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication requests. Please try again later.',
  },
});
