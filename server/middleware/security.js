import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

/**
 * Enterprise Helmet Security Headers Configuration
 * Enforces HSTS, clickjacking prevention (frame-ancestors / SAMEORIGIN),
 * MIME sniffing protection, strict referrer policy, and Turnstile-compatible CSP.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
      frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'sameorigin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Native Recursive NoSQL Injection Sanitizer
 * Recursively strips prohibited MongoDB query operators ($ and .) from user input
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      const cleanKey = key.replace(/[$]/g, '_').replace(/[.]/g, '_');
      obj[cleanKey] = sanitizeObject(obj[key]);
      delete obj[key];
    } else {
      obj[key] = sanitizeObject(obj[key]);
    }
  }
  return obj;
}

export const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

/**
 * Rate Limiter for Login Endpoint (/api/auth/login)
 * Protects against credential stuffing & automated brute force attacks.
 * Limit: 10 attempts per 15 minutes per IP (100 in dev/test)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this network. For security reasons, please try again in 15 minutes.',
    retryAfter: 900,
  },
});

/**
 * Rate Limiter for Citizen Registration (/api/auth/register)
 * Protects against mass automated account creation.
 * Limit: 10 attempts per hour per IP (100 in dev/test)
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration requests from this network. Please wait before creating more accounts.',
    retryAfter: 3600,
  },
});

/**
 * Rate Limiter for Password Reset Endpoints (/api/auth/reset-password)
 * Protects against password reset abuse & enumeration.
 * Limit: 5 requests per 15 minutes per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
    retryAfter: 900,
  },
});

/**
 * Rate Limiter for Sending OTP (prevents spamming SMS/Email gateways)
 * Limit: 5 requests in production per 15 minutes per IP (100 in dev/test)
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
 * Limit: 3 resend attempts per 15 minutes per IP (50 in dev/test)
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
 * Rate Limiter for OTP Verification (protects against brute-force guessing)
 * Limit: 10 verification attempts per 15 minutes per IP (100 in dev/test)
 */
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait before trying again.',
    retryAfter: 900,
  },
});

/**
 * General Authentication Rate Limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication requests. Please try again later.',
  },
});

export default {
  helmetMiddleware,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  sendOtpLimiter,
  resendOtpLimiter,
  verifyOtpLimiter,
  authLimiter,
};
