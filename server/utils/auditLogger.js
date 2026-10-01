import AuditLog from '../models/AuditLog.js';

/**
 * Sensitive field keys that MUST be redacted or filtered out of audit logs.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'otp',
  'phoneotp',
  'emailotp',
  'token',
  'authtoken',
  'jwt',
  'secret',
  'secretkey',
  'cookie',
  'authorization',
  'newpassword',
  'confirmpassword',
]);

/**
 * Sanitizes an object by stripping or masking sensitive security data.
 *
 * @param {any} data
 * @returns {any} Sanitized clone
 */
export function sanitizeLogDetails(data) {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogDetails(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeLogDetails(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Writes an immutable security audit event into the database.
 * Never fails or crashes the primary request thread.
 *
 * @param {Object} params
 * @param {string} params.action - e.g. 'AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED'
 * @param {'User'|'Complaint'|'OTP'|'System'} [params.entity='System']
 * @param {string} params.entityId - ID of the entity affected
 * @param {string} [params.performedBy='Anonymous'] - Identifier of actor
 * @param {'citizen'|'officer'|'admin'|'system'} [params.role='citizen']
 * @param {string} [params.ipAddress='0.0.0.0'] - Request IP address
 * @param {Object} [params.details={}] - Additional non-sensitive metadata
 */
export async function logSecurityEvent({
  action,
  entity = 'System',
  entityId = 'system',
  performedBy = 'Anonymous',
  role = 'citizen',
  ipAddress = '0.0.0.0',
  details = {},
}) {
  try {
    const cleanDetails = sanitizeLogDetails(details);

    await AuditLog.create({
      action,
      entity,
      entityId: String(entityId),
      performedBy: String(performedBy),
      role,
      ipAddress: String(ipAddress),
      details: cleanDetails,
      timestamp: new Date(),
    });
  } catch (err) {
    // Fail silently in production or log non-intrusive warning so app flow is never interrupted
    console.warn(`⚠️ [AuditLog] Failed to persist security log for action "${action}":`, err.message);
  }
}

export default logSecurityEvent;
