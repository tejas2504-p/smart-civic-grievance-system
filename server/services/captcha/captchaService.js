import crypto from 'crypto';

/**
 * Generate a cryptographically signed Civic Security CAPTCHA challenge.
 */
export function generateCivicCaptcha() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestamp = Date.now();
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'civic_portal_captcha_secret_2026';
  const hmac = crypto.createHmac('sha256', secret).update(`${code.toUpperCase()}:${timestamp}`).digest('hex');

  return {
    captchaId: `${hmac}.${timestamp}`,
    code,
    timestamp,
    expiresIn: 600,
  };
}

export async function verifyCaptcha(token, remoteIp = null) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, message: 'CAPTCHA token is required.' };
  }

  const cleanToken = token.trim();

  // 1. Civic Security Code Verification (Signed HMAC Challenge)
  // Format: CIVIC_CAPTCHA:<userInputCode>:<hmac>:<timestamp>
  if (cleanToken.startsWith('CIVIC_CAPTCHA:')) {
    const parts = cleanToken.split(':');
    if (parts.length === 4) {
      const [, userInputCode, hmac, timestampStr] = parts;
      const timestamp = parseInt(timestampStr, 10);

      if (isNaN(timestamp) || Date.now() - timestamp > 10 * 60 * 1000) {
        return { success: false, message: 'Security code has expired. Please refresh the CAPTCHA.' };
      }

      const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'civic_portal_captcha_secret_2026';
      const expectedHmac = crypto.createHmac('sha256', secret).update(`${userInputCode.trim().toUpperCase()}:${timestamp}`).digest('hex');

      try {
        const isMatch = hmac.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
        if (isMatch) {
          return { success: true, provider: 'civic-captcha' };
        }
      } catch {
        // ignore timing safe buffer mismatch
      }
      return { success: false, message: 'Invalid security code. Please check the characters and try again.' };
    }
  }

  const provider = (process.env.CAPTCHA_PROVIDER || 'cloudflare').toLowerCase();
  const secretKey = process.env.TURNSTILE_SECRET_KEY || process.env.RECAPTCHA_SECRET_KEY || '1x0000000000000000000000000000000AA';

  try {
    if (provider === 'cloudflare' || provider === 'turnstile') {
      const endpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', cleanToken);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, provider: 'cloudflare-turnstile', data };
      } else {
        console.warn('⚠️ [Turnstile Server Verification Failed]:', data['error-codes']);
        return {
          success: false,
          message: 'Human verification (CAPTCHA) failed. Please complete the CAPTCHA and try again.',
          errorCodes: data['error-codes'] || [],
        };
      }
    } else if (provider === 'recaptcha' || provider === 'google') {
      const endpoint = 'https://www.google.com/recaptcha/api/siteverify';
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', cleanToken);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, provider: 'google-recaptcha', data };
      } else {
        return {
          success: false,
          message: 'Human verification (CAPTCHA) failed. Please try again.',
          errorCodes: data['error-codes'] || [],
        };
      }
    }

    return { success: true, provider: 'default' };
  } catch (err) {
    console.error('❌ [CAPTCHA Verification Service Error]:', err.message);
    return { success: false, message: 'Unable to verify CAPTCHA with service provider. Please retry.' };
  }
}
