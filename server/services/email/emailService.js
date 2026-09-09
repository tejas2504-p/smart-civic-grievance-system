/**
 * Email OTP Service wrapper for backward compatibility
 * Delegates to the unified emailOtpService.js (Resend API)
 */
import { sendEmailOTP } from '../emailOtpService.js';

export { sendEmailOTP };
export default { sendEmailOTP };
