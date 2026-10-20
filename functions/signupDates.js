function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function signupDate(event, slot = {}) {
  if (isIsoDate(slot.date)) return slot.date;
  const offset = slot.offsetDays ?? 0;
  if (slot.scheduleMode !== 'relative' || !isIsoDate(event.eventDate) || !Number.isInteger(offset)) return '';
  const date = new Date(`${event.eventDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function signupDateText(event, slot = {}) {
  const date = signupDate(event, slot);
  return date
    ? new Date(`${date}T00:00:00Z`).toLocaleDateString('da-DK', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    })
    : event.dateText || '';
}

module.exports = { isIsoDate, signupDate, signupDateText };
