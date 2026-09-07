import { api } from './api';

export const otpService = {
  // Request real OTP dispatch for Phone and/or Email
  sendOTP: async (payload) => {
    return await api.sendOTP(payload);
  },

  // Verify Phone OTP with real backend session
  verifyPhoneOTP: async (verificationId, otp) => {
    return await api.verifyPhoneOTP({ verificationId, otp });
  },

  // Verify Email OTP with real backend session
  verifyEmailOTP: async (verificationId, otp) => {
    return await api.verifyEmailOTP({ verificationId, otp });
  },

  // Resend OTP via real backend provider
  resendOTP: async (verificationId, channel) => {
    return await api.resendOTP({ verificationId, channel });
  },
};

export default otpService;

