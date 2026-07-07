export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

export function sameDate(a: string, b: string) {
  return a === b;
}

export function formatDateLong(date: Date) {
  return date.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date) {
  return date.toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function monthLabel(monthIndex: number) {
  return new Date(2026, monthIndex, 1)
    .toLocaleDateString('da-DK', { month: 'long' })
    .replace(/^./, char => char.toUpperCase());
}

export function makeCalendarCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const start = getStartOfWeek(first);
  const last = new Date(year, monthIndex + 1, 0);
  const end = addDays(getStartOfWeek(last), 6);
  const cells: Array<{ date: Date; isoDate: string; inMonth: boolean }> = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    cells.push({
      date: new Date(cursor),
      isoDate: toIsoDate(cursor),
      inMonth: cursor.getMonth() === monthIndex,
    });
  }
  return cells;
}
