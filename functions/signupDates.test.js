const assert = require('node:assert/strict');
const test = require('node:test');
const { signupDate, signupDateText } = require('./signupDates');

const event = { eventDate: '2026-11-28', dateText: 'Lørdag 28. november' };

test('each signup shows its own shift date instead of the event date', () => {
  assert.equal(signupDateText(event, { date: '2026-12-05' }), 'lørdag den 5. december 2026');
  assert.equal(signupDateText(event, { date: '2026-12-12' }), 'lørdag den 12. december 2026');
  assert.equal(signupDate(event, { date: '2026-12-05' }), '2026-12-05');
});

test('relative shifts resolve across months, years and daylight saving', () => {
  assert.equal(signupDate(event, { scheduleMode: 'relative', offsetDays: 7 }), '2026-12-05');
  assert.equal(signupDate({ eventDate: '2026-12-31' }, { scheduleMode: 'relative', offsetDays: 1 }), '2027-01-01');
  assert.equal(signupDate({ eventDate: '2026-03-29' }, { scheduleMode: 'relative', offsetDays: -1 }), '2026-03-28');
  assert.equal(signupDate(event, { scheduleMode: 'relative' }), '2026-11-28');
  assert.equal(signupDate(event, { date: '2026-12-12', scheduleMode: 'relative', offsetDays: 7 }), '2026-12-12');
});

test('missing or invalid shift dates preserve the existing event text', () => {
  for (const slot of [{}, { date: '2026-02-30' }, { scheduleMode: 'relative', offsetDays: 1.5 }]) {
    assert.equal(signupDateText(event, slot), event.dateText);
    assert.equal(signupDate(event, slot), '');
  }
  assert.equal(signupDateText(event), event.dateText);
  assert.equal(signupDateText({}), '');
});
