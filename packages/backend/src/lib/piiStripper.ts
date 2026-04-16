/**
 * PII Stripping Utility
 * Removes highly sensitive keys from profile data before sending to AI endpoints.
 */

// Keys that should never be sent to external AI services
const SENSITIVE_KEYS = new Set([
  'ssn',
  'social_security',
  'password',
  'cc_number',
  'credit_card',
  'cvv',
  'cvc',
  'bank_account',
  'routing_number',
  'medical',
  'health'
]);

export function stripSensitivePII(profileData: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(profileData)) {
    // Check if the key name contains any sensitive keywords
    const isSensitive = Array.from(SENSITIVE_KEYS).some(sensitiveToken => 
      key.toLowerCase().includes(sensitiveToken)
    );

    if (!isSensitive) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = stripSensitivePII(value);
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
