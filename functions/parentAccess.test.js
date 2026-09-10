const assert = require('node:assert/strict');
const test = require('node:test');

const {
  hashValue,
  isAdminEmail,
  isValidEmail,
  normalizeEmail,
  safeReturnTo,
  slotUsageId,
} = require('./parentAccess');

test('normalizes e-mail identities consistently', () => {
  assert.equal(normalizeEmail('  Parent@Example.COM '), 'parent@example.com');
  assert.equal(isValidEmail('parent@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('keeps leader domain out of parent access', () => {
  assert.equal(isAdminEmail('leder@havetshelte.dk'), true);
  assert.equal(isAdminEmail('parent@havetshelte.com'), false);
});

test('only allows an internal parent return path', () => {
  assert.equal(safeReturnTo('/mine/signups/abc?tab=upcoming'), '/mine/signups/abc?tab=upcoming');
  assert.equal(safeReturnTo('https://example.com'), '/mine');
  assert.equal(safeReturnTo('//example.com'), '/mine');
  assert.equal(safeReturnTo('/events'), '/mine');
});

test('rate-limit and slot-usage keys are deterministic and non-plaintext', () => {
  const emailHash = hashValue('parent@example.com');
  assert.equal(emailHash.length, 64);
  assert.notEqual(emailHash, 'parent@example.com');
  assert.equal(slotUsageId('event-a', 'slot-a'), slotUsageId('event-a', 'slot-a'));
  assert.notEqual(slotUsageId('event-a', 'slot-a'), slotUsageId('event-a', 'slot-b'));
});
