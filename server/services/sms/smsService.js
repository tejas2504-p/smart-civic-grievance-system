/**
 * Transactional SMS Service wrapper for backward compatibility
 * Delegates to the unified smsOtpService.js
 */
import {
  normalizePhoneNumber,
  isValidIndianMobile,
  maskPhone,
  isDemoPhoneNumber,
  sendPhoneOtp,
} from '../smsOtpService.js';

export {
  normalizePhoneNumber,
  isValidIndianMobile,
  maskPhone,
  isDemoPhoneNumber,
  sendPhoneOtp,
};

// Aliases for compatibility
export const formatIndianPhoneNumber = normalizePhoneNumber;
export const sendSMSOTP = sendPhoneOtp;

export default {
  formatIndianPhoneNumber,
  normalizePhoneNumber,
  isValidIndianMobile,
  maskPhone,
  isDemoPhoneNumber,
  sendPhoneOtp,
  sendSMSOTP,
};
