import { validateStrongPassword } from './utils/passwordPolicy.js';
import { validateAttachment, sanitizeFilename } from './utils/fileSecurity.js';
import { sanitizeLogDetails } from './utils/auditLogger.js';
import User from './models/User.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🛡️ TESTING GOVERNMENT PORTAL SECURITY CONSTRAINTS');
console.log('======================================================\n');

// -----------------------------------------------------------
// TEST SUITE 1: STRONG PASSWORD POLICY
// -----------------------------------------------------------
console.log('🧪 [Test Suite 1]: Strong Password Policy Enforcement');

// 1. Weak length (< 8)
const resShort = validateStrongPassword('Gov@1');
assert(!resShort.isValid && resShort.message.includes('8 characters'), 'Rejects password shorter than 8 characters');

// 2. Missing uppercase
const resNoUpper = validateStrongPassword('govportal@2026');
assert(!resNoUpper.isValid && resNoUpper.message.includes('uppercase'), 'Rejects password without uppercase character');

// 3. Missing lowercase
const resNoLower = validateStrongPassword('GOVPORTAL@2026');
assert(!resNoLower.isValid && resNoLower.message.includes('lowercase'), 'Rejects password without lowercase character');

// 4. Missing number
const resNoNumber = validateStrongPassword('GovPortal@Secret');
assert(!resNoNumber.isValid && resNoNumber.message.includes('number'), 'Rejects password without numeric digit');

// 5. Missing special character
const resNoSpecial = validateStrongPassword('GovPortal2026');
assert(!resNoSpecial.isValid && resNoSpecial.message.includes('special character'), 'Rejects password without special character');

// 6. Common dictionary weak password
const resCommon1 = validateStrongPassword('password123');
assert(!resCommon1.isValid, 'Rejects "password123" from weak dictionary');

const resCommon2 = validateStrongPassword('admin123');
assert(!resCommon2.isValid, 'Rejects "admin123" from weak dictionary');

const resCommon3 = validateStrongPassword('12345678');
assert(!resCommon3.isValid, 'Rejects "12345678" from weak dictionary');

// 7. Valid strong passwords
const resValid1 = validateStrongPassword('GovPortal@2026');
assert(resValid1.isValid, 'Accepts "GovPortal@2026" meeting all criteria');

const resValid2 = validateStrongPassword('MahaGov#SafePass2026!');
assert(resValid2.isValid, 'Accepts complex strong passphrase "MahaGov#SafePass2026!"');

// -----------------------------------------------------------
// TEST SUITE 2: FILE UPLOAD & DOCUMENT SECURITY
// -----------------------------------------------------------
console.log('\n🧪 [Test Suite 2]: File Upload & Document Security');

// 1. Rejects dangerous executable extensions
const resExe = validateAttachment({ name: 'malware.exe', type: 'application/x-msdownload', size: 1024 });
assert(!resExe.isValid && resExe.message.includes('Executable files are blocked'), 'Blocks .exe file upload');

const resSh = validateAttachment({ name: 'exploit.sh', type: 'text/x-shellscript', size: 500 });
assert(!resSh.isValid, 'Blocks .sh script upload');

const resBat = validateAttachment({ name: 'script.bat', type: 'application/x-bat', size: 200 });
assert(!resBat.isValid, 'Blocks .bat script upload');

// 2. Size limit enforcement (> 5MB)
const resLarge = validateAttachment({ name: 'document.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 });
assert(!resLarge.isValid && resLarge.message.includes('5 MB limit'), 'Rejects document exceeding 5 MB');

// 3. Filename sanitization against path traversal
const sanitizedName = sanitizeFilename('../../etc/passwd.pdf');
assert(sanitizedName === 'passwd.pdf' || !sanitizedName.includes('..'), `Sanitizes directory traversal: ${sanitizedName}`);

// 4. Valid document format acceptance
const resValidDoc = validateAttachment({ name: 'water_tax_receipt.pdf', type: 'application/pdf', size: 1024 * 500 });
assert(resValidDoc.isValid, 'Accepts valid PDF document under 5 MB');

const resValidImg = validateAttachment({ name: 'pothole_photo.jpg', type: 'image/jpeg', size: 1024 * 800 });
assert(resValidImg.isValid, 'Accepts valid JPEG image under 5 MB');

// -----------------------------------------------------------
// TEST SUITE 3: AUDIT LOG SANITIZATION (ZERO LEAKAGE)
// -----------------------------------------------------------
console.log('\n🧪 [Test Suite 3]: Audit Log Sanitization');

const rawEvent = {
  email: 'citizen@example.com',
  password: 'GovPortal@2026',
  passwordHash: '$2b$10$xyz...',
  otp: '849201',
  token: 'jwt.token.here',
  action: 'LOGIN',
  ip: '127.0.0.1',
};

const cleanEvent = sanitizeLogDetails(rawEvent);

assert(cleanEvent.password === '[REDACTED]', 'Redacts raw password from audit log');
assert(cleanEvent.passwordHash === '[REDACTED]', 'Redacts password hash from audit log');
assert(cleanEvent.otp === '[REDACTED]', 'Redacts OTP from audit log');
assert(cleanEvent.token === '[REDACTED]', 'Redacts JWT/token from audit log');
assert(cleanEvent.email === 'citizen@example.com', 'Preserves non-sensitive operational metadata');
assert(cleanEvent.action === 'LOGIN', 'Preserves event action name');

// -----------------------------------------------------------
// TEST SUITE 4: ACCOUNT LOCKOUT LOGIC (USER MODEL)
// -----------------------------------------------------------
console.log('\n🧪 [Test Suite 4]: User Model Lockout & Brute-Force Protection');

const mockUser = new User({
  name: 'Test Citizen',
  email: 'lockout_test@example.com',
  password: 'GovPortal@2026',
  phone: '9876543210',
});

assert(!mockUser.isLocked(), 'New user account is unlocked by default');

// Simulate 4 failed attempts (warning threshold)
for (let i = 1; i <= 4; i++) {
  mockUser.handleFailedLogin(5, 15);
}
assert(mockUser.failedLoginAttempts === 4, 'Correctly tracks 4 failed login attempts');
assert(!mockUser.isLocked(), 'Account remains unlocked before reaching 5 attempts');

// 5th failed attempt triggers lock
mockUser.handleFailedLogin(5, 15);
assert(mockUser.failedLoginAttempts === 5, 'Records 5th failed attempt');
assert(mockUser.isLocked(), 'Account is locked after 5 consecutive failed attempts');
assert(mockUser.lockUntil && mockUser.lockUntil > Date.now(), 'lockUntil timestamp set into the future');

// Successful login resets lock
mockUser.handleSuccessfulLogin();
assert(!mockUser.isLocked(), 'Lockout cleared immediately upon successful login');
assert(mockUser.failedLoginAttempts === 0, 'Failed attempts reset to 0 upon successful login');

// -----------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------
console.log('\n======================================================');
console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 24 CRITICAL SECURITY UNIT CHECKS PASSED!\n');
  process.exit(0);
}
