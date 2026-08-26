const crypto = require('node:crypto');

const ADMIN_EMAIL_DOMAIN = '@havetshelte.dk';

function normalizeEmail(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en-US');
}

function isValidEmail(email) {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAdminEmail(email) {
  return normalizeEmail(email).endsWith(ADMIN_EMAIL_DOMAIN);
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function slotUsageId(eventId, slotId) {
  return hashValue(`${eventId}\u0000${slotId}`);
}

function safeReturnTo(value) {
  const candidate = String(value ?? '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '/mine';

  try {
    const parsed = new URL(candidate, 'https://parent-access.invalid');
    const isParentPath = parsed.pathname === '/mine' || parsed.pathname.startsWith('/mine/');
    return parsed.origin === 'https://parent-access.invalid' && isParentPath
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : '/mine';
  } catch {
    return '/mine';
  }
}

function requestIp(req) {
  const forwarded = String(req.get('x-forwarded-for') || '').split(',')[0].trim();
  return forwarded || String(req.ip || '').trim() || 'unknown';
}

module.exports = {
  ADMIN_EMAIL_DOMAIN,
  hashValue,
  isAdminEmail,
  isValidEmail,
  normalizeEmail,
  requestIp,
  safeReturnTo,
  slotUsageId,
};
