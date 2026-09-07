import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneOtpHash: {
      type: String,
      required: true,
    },
    emailOtpHash: {
      type: String,
      required: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    captchaVerified: {
      type: Boolean,
      default: false,
    },
    phoneAttempts: {
      type: Number,
      default: 0,
    },
    emailAttempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index: auto-deletes when expired
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    purpose: {
      type: String,
      enum: ['registration', 'login', 'password_reset'],
      default: 'registration',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound index to quickly find active sessions
otpVerificationSchema.index({ phoneNumber: 1, email: 1, isCompleted: 1 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

export default OTPVerification;
