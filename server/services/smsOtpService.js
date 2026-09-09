/**
 * Modular SMS OTP Service
 * Enforces Demo Phone Number restriction on the backend:
 * ONLY +91 8452940085 can receive real SMS OTP in demo mode.
 */

/**
 * Standardize and normalize Indian phone numbers to +91XXXXXXXXXX format.
 * Handles inputs like:
 * - "+918452940085" -> "+918452940085"
 * - "+91 8452940085" -> "+918452940085"
 * - "8452940085" -> "+918452940085"
 * - "91 8452940085" -> "+918452940085"
 * - "+91-8452940085" -> "+918452940085"
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const raw = phone.toString().trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  } else if (raw.startsWith('+91') && digits.length === 12) {
    return `+${digits}`;
  } else if (raw.startsWith('+')) {
    return `+${digits}`;
  }
  return digits.length > 10 ? `+${digits}` : `+91${digits}`;
}

/**
 * Check if the number is a valid 10-digit Indian mobile number
 */
export function isValidIndianMobile(phone) {
  const normalized = normalizePhoneNumber(phone);
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const mobileDigits = digits.slice(2);
    return /^[6-9]\d{9}$/.test(mobileDigits);
  }
  return false;
}

/**
 * Mask phone number for safe logging & display
 * E.g., "+91 84XXXXXX85"
 */
export function maskPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const last2 = digits.slice(-2);
    return `+91 ******${digits.slice(8, 10)}${last2}`;
  }
  if (digits.length >= 10) {
    return `+91 ******${digits.slice(-4)}`;
  }
  return '******';
}

/**
 * Validates whether the given phone is the allowed Demo Phone Number
 */
export function isDemoPhoneNumber(phoneNumber) {
  const demoPhone = normalizePhoneNumber(process.env.DEMO_PHONE_NUMBER || '+918452940085');
  const targetPhone = normalizePhoneNumber(phoneNumber);
  return targetPhone === demoPhone;
}

/**
 * Send Phone SMS OTP via server-side SMS provider.
 * Strictly blocks any non-demo phone number before calling SMS provider.
 *
 * @param {string} phoneNumber - Indian mobile number
 * @param {string} otp - 6-digit cryptographically generated OTP
 * @returns {Promise<{success: boolean, message?: string, error?: string, messageId?: string, blocked?: boolean}>}
 */
export async function sendPhoneOtp(phoneNumber, otp) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const isDemoMode = process.env.OTP_DEMO_MODE !== 'false';
  const masked = maskPhone(normalizedPhone);

  // 1. DEMO PHONE NUMBER RESTRICTION (Enforced on backend)
  if (isDemoMode && !isDemoPhoneNumber(normalizedPhone)) {
    console.warn(`🔒 [SMS Service] Rejected non-demo phone number: ${masked}`);
    return {
      success: false,
      blocked: true,
      error: 'SMS OTP verification is currently available only for the demo phone number.',
    };
  }

  console.log(`📱 [SMS Service] SMS OTP request accepted for demo phone: ${masked}`);

  const smsBody = `Your Government Grievance Portal verification OTP is: ${otp}. This OTP will expire in 5 minutes. Do not share this code with anyone.`;
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();

  // 2. Twilio SMS Provider
  if (provider === 'twilio') {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const fromNumber = (process.env.TWILIO_PHONE_NUMBER || process.env.SMS_PROVIDER_SENDER_ID || '').trim();

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ [SMS Service (Twilio)] Credentials missing (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER).');
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', normalizedPhone);
      formData.append('From', fromNumber);

      const useTrialTemplate = process.env.TWILIO_USE_TEMPLATE === 'true';
      formData.append('Body', useTrialTemplate ? 'sms_2fa' : smsBody);

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      let data = await response.json();

      // If trial account template restriction error 572006 occurs, fallback to Twilio approved 'sms_2fa' template
      if (!response.ok && (data.code === 572006 || data.message?.includes('predefined SMS templates'))) {
        console.log('ℹ️ [SMS Service (Twilio)] Trial account template restriction detected, switching to approved sms_2fa template...');
        formData.set('Body', 'sms_2fa');
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });
        data = await response.json();
      }

      if (response.ok) {
        console.log(`📱 [SMS Service (Twilio)] OTP SMS dispatched successfully to ${masked} [SID: ${data.sid}]`);
        const codeMatch = data.body ? data.body.match(/\b(\d{6})\b/) : null;
        const deliveredOtp = codeMatch ? codeMatch[1] : otp;
        return { success: true, provider: 'twilio', messageId: data.sid, deliveredOtp };
      } else {
        console.error(`❌ [SMS Service (Twilio) Error]: ${data.message || data.code}`);
        return {
          success: false,
          error: "We couldn't send the SMS verification code. Please try again.",
        };
      }
    } catch (err) {
      console.error(`❌ [SMS Service (Twilio) Exception]:`, err.message);
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }
  }

  // 3. Fast2SMS Provider
  if (provider === 'fast2sms') {
    const apiKey = process.env.SMS_PROVIDER_API_KEY || process.env.SMS_API_KEY;
    if (!apiKey) {
      console.error('❌ [SMS Service (Fast2SMS)] SMS_PROVIDER_API_KEY is not configured.');
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }

    try {
      const plainDigits = normalizedPhone.replace(/\D/g, '').slice(-10);
      const endpoint = 'https://www.fast2sms.com/dev/bulkV2';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: plainDigits,
        }),
      });

      const data = await response.json();
      if (data.return === true) {
        console.log(`📱 [SMS Service (Fast2SMS)] OTP SMS dispatched successfully to ${masked}`);
        return { success: true, provider: 'fast2sms', messageId: data.request_id };
      } else {
        console.error(`❌ [SMS Service (Fast2SMS) Error]:`, data.message);
        return {
          success: false,
          error: "We couldn't send the SMS verification code. Please try again.",
        };
      }
    } catch (err) {
      console.error(`❌ [SMS Service (Fast2SMS) Exception]:`, err.message);
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }
  }

  // 4. MSG91 Provider
  if (provider === 'msg91') {
    const apiKey = process.env.SMS_PROVIDER_API_KEY || process.env.SMS_API_KEY;
    const templateId = process.env.SMS_PROVIDER_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID;

    if (!apiKey || !templateId) {
      console.error('❌ [SMS Service (MSG91)] Credentials missing (SMS_PROVIDER_API_KEY / SMS_PROVIDER_TEMPLATE_ID).');
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }

    try {
      const plainDigits = normalizedPhone.replace(/\D/g, '');
      const endpoint = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${plainDigits}&otp=${otp}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authkey: apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.type === 'success') {
        console.log(`📱 [SMS Service (MSG91)] OTP SMS dispatched successfully to ${masked}`);
        return { success: true, provider: 'msg91', messageId: data.message };
      } else {
        console.error(`❌ [SMS Service (MSG91) Error]:`, data.message);
        return {
          success: false,
          error: "We couldn't send the SMS verification code. Please try again.",
        };
      }
    } catch (err) {
      console.error(`❌ [SMS Service (MSG91) Exception]:`, err.message);
      return {
        success: false,
        error: "We couldn't send the SMS verification code. Please try again.",
      };
    }
  }

  // Unknown or unconfigured provider
  console.error(`❌ [SMS Service] Unsupported or unconfigured SMS_PROVIDER: ${provider}`);
  return {
    success: false,
    error: "We couldn't send the SMS verification code. Please try again.",
  };
}

export default {
  normalizePhoneNumber,
  isValidIndianMobile,
  maskPhone,
  isDemoPhoneNumber,
  sendPhoneOtp,
};
