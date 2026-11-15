/**
 * CARETRACE PHI Sanitizer & Log Redaction Utility
 * PromptWars × Catalyst 2026: Phase 14 Hardening
 *
 * Prevents Protected Health Information (PHI), authentication tokens,
 * passwords, and private identifiers from appearing in application logs.
 */

// Sensitive object keys that must be masked in logging and diagnostics
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'serviceRoleKey',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'pin',
  'accessPin',
  'rxNumber',
  'nationalInsuranceNumber',
]);

// Regular expressions to detect and redact sensitive patterns in strings
const REGEX_PATTERNS = [
  // Bearer tokens and JWTs
  { regex: /Bearer\s+([A-Za-z0-9\-._~+/]+=*)/gi, replace: 'Bearer [REDACTED_TOKEN]' },
  { regex: /ey[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+/g, replace: '[REDACTED_JWT]' },
  // Email addresses
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replace: '[REDACTED_EMAIL]' },
  // Phone numbers (US / international formats)
  { regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replace: '[REDACTED_PHONE]' },
  // Social Security Numbers (SSN)
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replace: '[REDACTED_SSN]' },
  // API Keys (e.g. resend, caretrace, supabase)
  { regex: /(re_|demo-|key-)[A-Za-z0-9_-]{16,}/gi, replace: '[REDACTED_API_KEY]' },
];

/**
 * Redacts known sensitive patterns inside arbitrary string text.
 */
export function redactString(input: string): string {
  if (!input || typeof input !== 'string') return input;
  let result = input;
  for (const { regex, replace } of REGEX_PATTERNS) {
    result = result.replace(regex, replace);
  }
  return result;
}

/**
 * Deeply traverses an object or array, masking sensitive keys and redacting text strings.
 */
export function sanitizeForLog<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactString(data) as unknown as T;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLog(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else if (typeof value === 'string') {
      sanitized[key] = redactString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Secure logging utility wrapper that sanitizes payloads before writing to console.
 */
export const secureLogger = {
  info: (message: string, context?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${redactString(message)}`, context ? sanitizeForLog(context) : '');
    }
  },
  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${redactString(message)}`, context ? sanitizeForLog(context) : '');
  },
  error: (message: string, context?: any) => {
    console.error(`[ERROR] ${redactString(message)}`, context ? sanitizeForLog(context) : '');
  },
};
