import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin'],
    default: 'citizen',
  },
  // Specific to officers
  department: {
    type: String,
    trim: true,
  },
  zone: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  lastLoginAt: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Handle failed login attempt with progressive delay & temporary lockout (15 minutes)
userSchema.methods.handleFailedLogin = async function (maxAttempts = 5, lockTimeMinutes = 15) {
  // If previous lock has expired, reset counter to 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  }

  // Lock account if max attempts exceeded
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
  }

  await this.save();
  return {
    isLocked: this.isLocked(),
    attemptsRemaining: Math.max(0, maxAttempts - this.failedLoginAttempts),
    lockUntil: this.lockUntil,
  };
};

// Reset lockout state on successful authentication
userSchema.methods.handleSuccessfulLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLoginAt = new Date();
  await this.save();
};

export default mongoose.models.User || mongoose.model('User', userSchema);
