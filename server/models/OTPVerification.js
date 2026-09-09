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
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['phone', 'email', 'both'],
      default: 'both',
    },
    phoneOtpHash: {
      type: String,
    },
    emailOtpHash: {
      type: String,
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
    phoneOtpExpiresAt: {
      type: Date,
    },
    emailOtpExpiresAt: {
      type: Date,
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
    pendingRegistration: {
      name: { type: String },
      passwordHash: { type: String },
      address: { type: String },
      role: { type: String, default: 'citizen' },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Ensure at least one contact method is provided
otpVerificationSchema.pre('validate', function () {
  if (!this.phoneNumber && !this.email) {
    this.invalidate('phoneNumber', 'At least one contact method (phone number or email address) is required.');
  }
});

// Compound index to quickly find active sessions
otpVerificationSchema.index({ phoneNumber: 1, email: 1, isCompleted: 1 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

export default OTPVerification;
