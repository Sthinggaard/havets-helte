const ACTIVE_GROUP_OPTIONS = [
  { id: 'ulv', label: 'Ulv' },
  { id: 'junior', label: 'Junior' },
  { id: 'trop', label: 'Trop' },
  { id: 'senior', label: 'Senior' },
  { id: 'landkrabber', label: 'Landkrabber' },
];

const RETIRED_GROUP_OPTIONS = [
  { id: 'baever', label: 'Bæver' },
  { id: 'soespejder', label: 'Søspejder' },
];

export const GROUP_OPTIONS = ACTIVE_GROUP_OPTIONS;

const GROUP_ID_ALIASES = new Map([
  ['landkrabber', 'landkrabber'],
  ['landkrabberne', 'landkrabber'],
  ['søspejder', 'soespejder'],
]);

const GROUP_LABEL_BY_ID = new Map(
  [...ACTIVE_GROUP_OPTIONS, ...RETIRED_GROUP_OPTIONS].map(group => [group.id, group.label])
);
const GROUP_ID_BY_NORMALIZED_LABEL = new Map(
  [...ACTIVE_GROUP_OPTIONS, ...RETIRED_GROUP_OPTIONS].map(group => [normalizeGroupLabel(group.label), group.id])
);

export function normalizeGroupLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function getGroupNameById(groupId) {
  return GROUP_LABEL_BY_ID.get(groupId) || '';
}

export function resolveGroupId(record) {
  if (record?.groupId && GROUP_LABEL_BY_ID.has(record.groupId)) return record.groupId;
  const legacyName = record?.groupName || record?.gren || '';
  const normalized = normalizeGroupLabel(legacyName);
  return GROUP_ID_ALIASES.get(normalized) || GROUP_ID_BY_NORMALIZED_LABEL.get(normalized) || '';
}

export function resolveGroupName(record) {
  return getGroupNameById(record?.groupId) || record?.groupName || record?.gren || '';
}

export function groupInitials(record) {
  const name = resolveGroupName(record) || 'Gruppe';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function populateGroupSelect(select, selectedGroupId = '') {
  if (!select) return;
  select.innerHTML = '<option value="">Vælg gren</option>';
  for (const group of GROUP_OPTIONS) {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.label;
    select.appendChild(option);
  }
  select.value = selectedGroupId;
}

// Mødedag er bevidst uafhængig af gren — nogle grene (fx Junior, Ulv) kører to
// hold på forskellige ugedage, andre kører ét. Dagen er aldrig en del af selve
// gren-værdien (ingen "Junior mandag"-gren), kun et separat, valgfrit felt.
export const DAY_OPTIONS = [
  { id: 'mandag', label: 'Mandag' },
  { id: 'tirsdag', label: 'Tirsdag' },
  { id: 'onsdag', label: 'Onsdag' },
  { id: 'torsdag', label: 'Torsdag' },
  { id: 'fredag', label: 'Fredag' },
  { id: 'loerdag', label: 'Lørdag' },
  { id: 'soendag', label: 'Søndag' },
];

const DAY_LABEL_BY_ID = new Map(DAY_OPTIONS.map(day => [day.id, day.label]));

export function getDayNameById(dayId) {
  return DAY_LABEL_BY_ID.get(dayId) || '';
}

export function populateDaySelect(select, selectedDayId = '') {
  if (!select) return;
  select.innerHTML = '<option value="">Ingen fast mødedag</option>';
  for (const day of DAY_OPTIONS) {
    const option = document.createElement('option');
    option.value = day.id;
    option.textContent = day.label;
    select.appendChild(option);
  }
  select.value = selectedDayId;
}

export function getTeamLabel(dayId) {
  const dayName = getDayNameById(dayId);
  return dayName ? `${dayName}shold` : '';
}

export function getTeamId(groupId, dayId) {
  return `${String(groupId || '').trim()}__${String(dayId || '').trim()}`;
}

export function getAgeFromBirthdate(isoDate, referenceDate = new Date()) {
  if (!isoDate) return null;
  const birthDate = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const ref = new Date(referenceDate);
  const monthDelta = ref.getMonth() - birthDate.getMonth();
  let age = ref.getFullYear() - birthDate.getFullYear();
  if (monthDelta < 0 || (monthDelta === 0 && ref.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export function getAgeInCalendarYearFromBirthdate(isoDate, calendarYear = new Date().getFullYear()) {
  if (!isoDate) return null;
  const birthDate = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  return calendarYear - birthDate.getFullYear();
}
