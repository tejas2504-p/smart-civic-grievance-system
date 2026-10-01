/**
 * Government Portal - Strong Password Policy
 * Authoritative Backend Password Validation
 */

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'admin123',
  'user123',
  'govportal123',
  'welcome123',
  'pass@123',
  'admin@123',
  'test1234',
  'secret123',
  'india@123',
  'portal@123',
  'mumbai@123',
  'maharashtra123',
]);

/**
 * Validates a password against government-grade security constraints.
 *
 * Rules:
 * 1. Minimum 8 characters (prefer 12+)
 * 2. At least 1 uppercase letter
 * 3. At least 1 lowercase letter
 * 4. At least 1 numeric digit
 * 5. At least 1 special character (!@#$%^&* etc.)
 * 6. Not in the common weak dictionary
 *
 * @param {string} password
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long (12+ characters recommended).',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must not exceed 128 characters.',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter (A-Z).',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter (a-z).',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number (0-9).',
    };
  }

  // Special characters: common symbols
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (e.g. !@#$%^&*).',
    };
  }

  // Check weak passwords
  const normalized = password.toLowerCase().trim();
  if (COMMON_WEAK_PASSWORDS.has(normalized)) {
    return {
      isValid: false,
      message: 'This password is too common or easily guessed. Please choose a more complex password.',
    };
  }

  return { isValid: true };
}

export default validateStrongPassword;
