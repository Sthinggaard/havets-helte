const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');

const {
  hashValue,
  isAdminEmail,
  isValidEmail,
  normalizeEmail,
  requestIp,
  safeReturnTo,
  slotUsageId,
} = require('./parentAccess');

admin.initializeApp();

const db = admin.firestore();
const leaderboardRef = db.collection('leaderboards').doc('volunteers');
const privateLeaderboardRef = db.collection('leaderboardPrivate').doc('volunteers');
const parentAccessAppsScriptSecret = defineSecret('PARENT_ACCESS_APPS_SCRIPT_SECRET');
const parentAccessAppsScriptUrl = defineString('PARENT_ACCESS_APPS_SCRIPT_URL', {
  default: 'https://script.google.com/macros/s/AKfycbyfTjLyaY9sdOmJAtw6ntIu8KrdLB2NYBqfMbICCjslDK3CLJFKpTZTYR_KTiRy4vd1CA/exec',
});
const parentAccessSiteUrl = defineString('PARENT_ACCESS_SITE_URL', {
  default: 'https://havets-helte.web.app',
});

const PARENT_ACCESS_WINDOW_MS = 20 * 60 * 1000;
const PARENT_ACCESS_EMAIL_LIMIT = 3;
const PARENT_ACCESS_IP_LIMIT = 10;
const VOLUNTEER_LEADERBOARD_VERSION = 6;

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function apiError(status, code, message) {
  return new ApiError(status, code, message);
}

function requestBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function sendApiError(res, error, fallbackMessage) {
  if (error instanceof ApiError) {
    res.status(error.status).json({ status: error.code, message: error.message });
    return;
  }

  logger.error('parent access request failed', { errorMessage: error?.message || 'unknown error' });
  const isDev = parentAccessSiteUrl.value().includes('havets-helte-dev');
  res.status(500).json({
    status: 'error',
    message: isDev && error?.message ? `${fallbackMessage} (${error.message})` : fallbackMessage,
  });
}

function getConfiguredSiteUrl() {
  const configured = parentAccessSiteUrl.value();
  const url = new URL(configured);
  if (url.protocol !== 'https:') {
    throw new Error('PARENT_ACCESS_SITE_URL must use HTTPS.');
  }
  return url.origin;
}

function emailLinkSettings(returnTo) {
  const siteUrl = getConfiguredSiteUrl();
  const destination = new URL(safeReturnTo(returnTo), siteUrl);
  return {
    url: destination.toString(),
    handleCodeInApp: true,
  };
}

async function sendAppsScriptMail(payload) {
  const endpoint = parentAccessAppsScriptUrl.value();
  const secret = parentAccessAppsScriptSecret.value();
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || !secret) {
    throw new Error('Parent access mail delivery is not configured securely.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, secret }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Apps Script responded with ${response.status}.`);
  }
  const result = (await response.text()).trim();
  if (result !== 'ok') {
    throw new Error(`Apps Script rejected the request: ${result || 'empty response'}.`);
  }
}

async function consumeParentAccessRateLimit(email, ip) {
  const now = Date.now();
  const emailRef = db.collection('parentAccessRateLimits').doc(`email-${hashValue(email)}`);
  const ipRef = db.collection('parentAccessRateLimits').doc(`ip-${hashValue(ip)}`);

  return db.runTransaction(async transaction => {
    const [emailSnap, ipSnap] = await Promise.all([
      transaction.get(emailRef),
      transaction.get(ipRef),
    ]);

    const next = (snap, limit) => {
      const current = snap.data() || {};
      const startedAt = current.windowStartedAt?.toMillis?.() || 0;
      const inWindow = now - startedAt < PARENT_ACCESS_WINDOW_MS;
      const count = inWindow ? Number(current.count || 0) : 0;
      return { allowed: count < limit, count: count + 1, windowStartedAt: inWindow ? startedAt : now };
    };

    const email = next(emailSnap, PARENT_ACCESS_EMAIL_LIMIT);
    const address = next(ipSnap, PARENT_ACCESS_IP_LIMIT);
    if (!email.allowed || !address.allowed) return false;

    transaction.set(emailRef, {
      count: email.count,
      windowStartedAt: Timestamp.fromMillis(email.windowStartedAt),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(ipRef, {
      count: address.count,
      windowStartedAt: Timestamp.fromMillis(address.windowStartedAt),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function verifyParentIdentity(req) {
  const authorization = String(req.get('authorization') || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  if (!token) throw apiError(401, 'unauthenticated', 'Åbn dit link fra e-mailen for at fortsætte.');

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const email = normalizeEmail(decoded.email);
    if (!isValidEmail(email) || isAdminEmail(email)) {
      throw apiError(403, 'forbidden', 'Denne adgang er kun for forældre.');
    }
    return { email, uid: decoded.uid };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw apiError(401, 'unauthenticated', 'Åbn dit link fra e-mailen for at fortsætte.');
  }
}

async function verifyAdminIdentity(req) {
  const authorization = String(req.get('authorization') || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  if (!token) throw apiError(401, 'unauthenticated', 'Log ind som leder for at fortsætte.');
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (!isAdminEmail(normalizeEmail(decoded.email))) throw apiError(403, 'forbidden', 'Kun ledere kan ændre tilmeldinger.');
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw apiError(401, 'unauthenticated', 'Log ind som leder for at fortsætte.');
  }
}

function requiredString(value, field, maxLength = 200) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > maxLength) {
    throw apiError(400, 'invalid', `${field} er ugyldigt.`);
  }
  return normalized;
}

function slotLabel(slot) {
  return slot.sublabel ? `${slot.label || ''} · ${slot.sublabel}`.trim() : String(slot.label || '');
}

function eventSlotUsageRef(eventId, slotId) {
  return db.collection('eventSlotUsage').doc(slotUsageId(eventId, slotId));
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function signupDeadlineDate(event, slot) {
  if (slot.componentType !== 'signup') return '';
  if (isIsoDate(slot.deadlineDate)) return slot.deadlineDate;
  if (slot.deadlineScheduleMode !== 'relative' || !isIsoDate(event.eventDate) || !Number.isInteger(slot.deadlineOffsetDays)) return '';
  const [year, month, day] = event.eventDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + slot.deadlineOffsetDays));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function copenhagenDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function signupCountForSlot(transaction, eventId, slotId) {
  const snapshot = await transaction.get(
    db.collection('signups').where('eventId', '==', eventId).where('slotId', '==', slotId),
  );
  return snapshot.docs.reduce((total, signup) => {
    const data = signup.data();
    return data.waitlist === true ? total : total + Math.max(1, Number(data.groupSize) || 1);
  }, 0);
}

async function loadParentSignups(email) {
  const contacts = new Map();
  const [normalizedSnap, legacySnap] = await Promise.all([
    db.collection('signupContacts').where('emailNormalized', '==', email).get(),
    db.collection('signupContacts').where('email', '==', email).get(),
  ]);
  for (const snap of [normalizedSnap, legacySnap]) {
    for (const doc of snap.docs) contacts.set(doc.id, doc);
  }

  const contactDocs = [...contacts.values()];
  const signupDocs = contactDocs.length
    ? await db.getAll(...contactDocs.map(contact => db.collection('signups').doc(contact.id)))
    : [];
  const signupById = new Map(signupDocs.filter(doc => doc.exists).map(doc => [doc.id, doc.data()]));
  const eventIds = [...new Set(signupDocs.filter(doc => doc.exists).map(doc => String(doc.get('eventId') || ''))).values()].filter(Boolean);
  const eventDocs = eventIds.length ? await db.getAll(...eventIds.map(id => db.collection('events').doc(id))) : [];
  const events = new Map(eventDocs.filter(doc => doc.exists).map(doc => [doc.id, doc.data()]));

  return contactDocs
    .map(contact => {
      const signup = signupById.get(contact.id);
      if (!signup) return null;
      const event = events.get(signup.eventId) || {};
      const slot = Array.isArray(event.slots) ? event.slots.find(item => item?.id === signup.slotId) : null;
      return {
        id: contact.id,
        eventId: signup.eventId,
        eventType: event.type || 'event',
        eventTitle: event.title || contact.get('eventTitle') || 'Arrangement',
        dateText: event.dateText || '',
        location: event.location || '',
        slotLabel: slotLabel(slot || {}),
        waitlist: signup.waitlist === true,
        groupSize: Math.max(1, Number(signup.groupSize) || 1),
        audienceGroupLabel: typeof signup.audienceGroupLabel === 'string' ? signup.audienceGroupLabel : '',
        createdAt: contact.get('created')?.toMillis?.() || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

function leaderboardIdentityKey(name, contact) {
  const email = normalizeEmail(contact?.emailNormalized || contact?.email);
  return email ? `email:${hashValue(email)}` : `name:${normalizeName(name).toLocaleLowerCase('da-DK')}`;
}

function sortedEntries(entries) {
  return [...entries.values()]
    .filter(entry => entry.points > 0)
    // Do not use the name as a tie-breaker: that unfairly favours people
    // whose names happen to come first alphabetically.
    .sort((a, b) => b.points - a.points || b.signups - a.signups);
}

function publicLeaderboardEntries(entries) {
  return sortedEntries(entries).map(({ name, points, signups, roleCounts }) => ({ name, points, signups, roleCounts }));
}

function volunteerRoleWeight(role) {
  const value = normalizeName(role).toLocaleLowerCase('da-DK');
  if (/(koordinator|togholder|ansvarlig|leder)/u.test(value)) return 5;
  if (/(opsæt|opsaet|nedtag)/u.test(value)) return 3;
  if (/(hjælper|hjaelper|opryd|service)/u.test(value)) return 1;
  return 2;
}

async function volunteerContribution(signup, contact, eventCache) {
  if (!signup || signup.waitlist === true || !signup.eventId || !signup.slotId) return null;

  const name = normalizeName(signup.name);
  if (!name) return null;

  let event = eventCache.get(signup.eventId);
  if (event === undefined) {
    const eventSnap = await db.collection('events').doc(signup.eventId).get();
    event = eventSnap.exists ? eventSnap.data() : null;
    eventCache.set(signup.eventId, event);
  }
  if (!event || !Array.isArray(event.slots)) return null;

  const slot = event.slots.find(candidate => candidate && candidate.id === signup.slotId);
  const componentType = slot?.componentType;
  if (!slot || (componentType && componentType !== 'task' && componentType !== 'shift')
    || (componentType && (slot.kind ?? 'volunteer') !== 'volunteer')) return null;

  return {
    key: leaderboardIdentityKey(name, contact),
    name,
    points: volunteerRoleWeight(slot.role),
    role: normalizeName(slot.role) || 'Vagt',
  };
}

async function rebuildVolunteerLeaderboard() {
  const [eventsSnap, signupsSnap, contactsSnap] = await Promise.all([
    db.collection('events').get(),
    db.collection('signups').get(),
    db.collection('signupContacts').get(),
  ]);
  const events = new Map(eventsSnap.docs.map(eventDoc => [eventDoc.id, eventDoc.data()]));
  const contacts = new Map(contactsSnap.docs.map(contactDoc => [contactDoc.id, contactDoc.data()]));
  const entries = new Map();

  for (const signupDoc of signupsSnap.docs) {
    const contribution = await volunteerContribution(signupDoc.data(), contacts.get(signupDoc.id), events);
    if (!contribution) continue;
    const current = entries.get(contribution.key) || { name: contribution.name, points: 0, signups: 0, roleCounts: {} };
    current.points += contribution.points;
    current.signups += 1;
    current.roleCounts[contribution.role] = (current.roleCounts[contribution.role] || 0) + 1;
    entries.set(contribution.key, current);
  }

  const leaderboard = publicLeaderboardEntries(entries);
  const batch = db.batch();
  batch.set(privateLeaderboardRef, {
    entries: Object.fromEntries(entries),
    version: VOLUNTEER_LEADERBOARD_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(leaderboardRef, {
    entries: leaderboard,
    initialized: true,
    version: VOLUNTEER_LEADERBOARD_VERSION,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return leaderboard;
}

exports.volunteerLeaderboard = onRequest({ region: 'europe-west1', cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).send('Kun GET er tilladt.');
    return;
  }

  try {
    const cached = await leaderboardRef.get();
    const cachedData = cached.data();
    const entries = cachedData?.initialized === true && cachedData?.version === VOLUNTEER_LEADERBOARD_VERSION
      ? cachedData.entries || []
      : await rebuildVolunteerLeaderboard();
    res.status(200).json({ entries });
  } catch (error) {
    logger.error('volunteerLeaderboard failed', error);
    res.status(500).send('Kunne ikke hente frivillighelte.');
  }
});

exports.updateVolunteerLeaderboard = onDocumentWritten({
  document: 'signups/{signupId}',
  region: 'europe-west1',
}, async event => {
  const eventCache = new Map();
  const contactSnap = await db.collection('signupContacts').doc(event.params.signupId).get();
  if (event.data.before.exists && !event.data.after.exists && !contactSnap.exists) {
    await rebuildVolunteerLeaderboard();
    return;
  }
  const contact = contactSnap.data();
  const [before, after] = await Promise.all([
    volunteerContribution(event.data.before.exists ? event.data.before.data() : null, contact, eventCache),
    volunteerContribution(event.data.after.exists ? event.data.after.data() : null, contact, eventCache),
  ]);
  if (before?.key === after?.key && before?.points === after?.points && before?.role === after?.role) return;

  const privateSnap = await privateLeaderboardRef.get();
  if (privateSnap.get('version') !== VOLUNTEER_LEADERBOARD_VERSION) {
    await rebuildVolunteerLeaderboard();
    return;
  }

  await db.runTransaction(async transaction => {
    const [privateBoardSnap, leaderboardSnap] = await Promise.all([
      transaction.get(privateLeaderboardRef),
      transaction.get(leaderboardRef),
    ]);
    const stored = privateBoardSnap.data();
    const entries = new Map(
      Object.entries(stored?.entries || {}).map(([key, entry]) => [key, { ...entry, roleCounts: { ...entry.roleCounts } }]),
    );

    for (const contribution of [before, after]) {
      if (!contribution) continue;
      const current = entries.get(contribution.key) || { name: contribution.name, points: 0, signups: 0, roleCounts: {} };
      current.points += contribution === before ? -before.points : after.points;
      current.signups += contribution === before ? -1 : 1;
      current.roleCounts[contribution.role] = (current.roleCounts[contribution.role] || 0) + (contribution === before ? -1 : 1);
      if (current.roleCounts[contribution.role] <= 0) delete current.roleCounts[contribution.role];
      if (current.points > 0 && current.signups > 0) entries.set(contribution.key, current);
      else entries.delete(contribution.key);
    }

    transaction.set(privateLeaderboardRef, {
      entries: Object.fromEntries(entries),
      version: VOLUNTEER_LEADERBOARD_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(leaderboardRef, {
      entries: publicLeaderboardEntries(entries),
      initialized: leaderboardSnap.get('initialized') === true,
      version: VOLUNTEER_LEADERBOARD_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
});

exports.manageVolunteerSignup = onRequest({ region: 'europe-west1', cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ status: 'method_not_allowed', message: 'Kun POST er tilladt.' }); return; }

  try {
    await verifyAdminIdentity(req);
    const body = requestBody(req);
    const signupId = requiredString(body.signupId, 'Tilmeldingen', 160);
    const action = requiredString(body.action, 'Handlingen', 20);
    if (action !== 'approve' && action !== 'move') throw apiError(400, 'invalid', 'Handlingen er ugyldig.');
    const targetSlotId = action === 'move' ? requiredString(body.targetSlotId, 'Målpladsen', 160) : '';

    const result = await db.runTransaction(async transaction => {
      const signupRef = db.collection('signups').doc(signupId);
      const signupSnap = await transaction.get(signupRef);
      if (!signupSnap.exists) throw apiError(404, 'not_found', 'Tilmeldingen findes ikke længere.');
      const signup = signupSnap.data();
      const eventRef = db.collection('events').doc(signup.eventId);
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) throw apiError(404, 'not_found', 'Arrangementet findes ikke længere.');
      const event = eventSnap.data();
      const source = Array.isArray(event.slots) ? event.slots.find(slot => slot?.id === signup.slotId) : null;
      if (!source) throw apiError(409, 'invalid_slot', 'Den nuværende plads findes ikke længere.');
      const groupSize = Math.max(1, Number(signup.groupSize) || 1);
      const sourceUsageRef = eventSlotUsageRef(signup.eventId, signup.slotId);
      await transaction.get(sourceUsageRef);
      const sourceConfirmed = await signupCountForSlot(transaction, signup.eventId, signup.slotId);

      if (action === 'approve') {
        if (signup.waitlist !== true) throw apiError(409, 'already_confirmed', 'Tilmeldingen er allerede godkendt.');
        transaction.update(signupRef, { waitlist: false });
        transaction.set(sourceUsageRef, {
          eventId: signup.eventId, slotId: signup.slotId,
          confirmed: sourceConfirmed + groupSize, updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return { slotId: signup.slotId, waitlist: false };
      }

      if (targetSlotId === signup.slotId) throw apiError(400, 'invalid', 'Vælg en anden plads.');
      const target = event.slots.find(slot => slot?.id === targetSlotId);
      if (!target || source.kind !== 'volunteer' || target.kind !== 'volunteer'
        || target.componentType !== source.componentType || target.registrationMode === 'memberService') {
        throw apiError(400, 'invalid_slot', 'Vælg en anden opgave eller vagt af samme type.');
      }
      if (groupSize < (Number(target.groupMin) || 1) || groupSize > (Number(target.groupMax) || 1)
        || (target.requiresAdult === true && signup.adult !== true)) {
        throw apiError(409, 'not_eligible', 'Tilmeldingen opfylder ikke kravene til den valgte plads.');
      }
      const targetUsageRef = eventSlotUsageRef(signup.eventId, targetSlotId);
      await transaction.get(targetUsageRef);
      const targetConfirmed = await signupCountForSlot(transaction, signup.eventId, targetSlotId);
      const capacity = Number(target.capacity) || 0;
      const waitlist = signup.waitlist === true || (capacity > 0 && targetConfirmed + groupSize > capacity);

      transaction.update(signupRef, { slotId: targetSlotId, waitlist });
      if (signup.waitlist !== true) transaction.set(sourceUsageRef, {
        eventId: signup.eventId, slotId: signup.slotId,
        confirmed: Math.max(0, sourceConfirmed - groupSize), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      if (!waitlist) transaction.set(targetUsageRef, {
        eventId: signup.eventId, slotId: targetSlotId,
        confirmed: targetConfirmed + groupSize, updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { slotId: targetSlotId, waitlist };
    });

    res.status(200).json({ status: 'ok', ...result });
  } catch (error) {
    if (error instanceof ApiError) { res.status(error.status).json({ status: error.code, message: error.message }); return; }
    logger.error('manageVolunteerSignup failed', error);
    res.status(500).json({ status: 'error', message: 'Kunne ikke ændre tilmeldingen. Prøv igen.' });
  }
});

// Passwordless parent access. Firebase Auth owns the short-lived, single-use
// e-mail action code; this function owns delivery, abuse protection and the
// domain boundary that keeps leader identities on the admin path.
exports.requestParentAccessLink = onRequest({
  region: 'europe-west1',
  cors: true,
  invoker: 'public',
  secrets: [parentAccessAppsScriptSecret],
}, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'method_not_allowed', message: 'Kun POST er tilladt.' });
    return;
  }

  // Always return the same successful response for accepted, unknown, invalid
  // and rate-limited e-mail addresses. No account lookup is performed here.
  const genericResponse = () => res.status(200).json({
    status: 'sent',
    message: 'Hvis e-mailadressen kan bruges her, har vi sendt et adgangslink.',
  });

  const data = requestBody(req);
  const email = normalizeEmail(data.email);
  if (!isValidEmail(email) || isAdminEmail(email)) {
    genericResponse();
    return;
  }

  try {
    const allowed = await consumeParentAccessRateLimit(email, requestIp(req));
    if (!allowed) {
      logger.warn('parent access request rate limited', { emailHash: hashValue(email) });
      genericResponse();
      return;
    }

    const link = await admin.auth().generateSignInWithEmailLink(email, emailLinkSettings(data.returnTo));
    await sendAppsScriptMail({ type: 'parentAccess', email, magicLink: link });
    logger.info('parent access link requested', { emailHash: hashValue(email) });
    genericResponse();
  } catch (error) {
    logger.error('parent access mail delivery failed', { errorMessage: error?.message || 'unknown error' });
    // This remains generic so operational errors cannot be used to enumerate
    // identities. A parent can safely retry after the issue is resolved.
    genericResponse();
  }
});

exports.submitSignup = onRequest({
  region: 'europe-west1',
  cors: true,
  invoker: 'public',
  secrets: [parentAccessAppsScriptSecret],
}, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'method_not_allowed', message: 'Kun POST er tilladt.' });
    return;
  }

  try {
    const data = requestBody(req);
    const eventId = requiredString(data.eventId, 'Arrangementet', 160);
    const slotId = requiredString(data.slotId, 'Opgaven', 160);
    const name = requiredString(data.name, 'Navnet');
    const childMode = data.childMode === true;
    const email = childMode ? '' : normalizeEmail(data.email);
    if (!childMode && !isValidEmail(email)) {
      throw apiError(400, 'invalid', 'Mailadressen er ugyldig.');
    }
    const groupSize = Number(data.groupSize);
    if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
      throw apiError(400, 'invalid', 'Antal deltagere er ugyldigt.');
    }
    const audienceGroupId = typeof data.audienceGroupId === 'string' ? data.audienceGroupId.trim() : '';
    const waitlistPreferred = data.waitlistPreferred === true;
    const signupRef = db.collection('signups').doc();
    const contactRef = db.collection('signupContacts').doc(signupRef.id);

    const outcome = await db.runTransaction(async transaction => {
      const eventRef = db.collection('events').doc(eventId);
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists || eventSnap.get('active') === false) {
        throw apiError(404, 'not_found', 'Opgaven findes ikke længere.');
      }

      const event = eventSnap.data() || {};
      const slot = Array.isArray(event.slots) ? event.slots.find(candidate => candidate?.id === slotId) : null;
      if (!slot) throw apiError(404, 'not_found', 'Pladsen findes ikke længere.');
      if (slot.registrationMode === 'memberService') {
        throw apiError(409, 'external_registration', 'Tilmeldingen foregår i Medlemsservice.');
      }
      const eligibleGroups = Array.isArray(slot.eligibleGroups) ? slot.eligibleGroups : [];
      const audienceGroup = eligibleGroups.find(group => group && group.id === audienceGroupId);
      if (eligibleGroups.length && !audienceGroup) {
        throw apiError(400, 'invalid', 'Vælg en af de klaner eller hold, der kan tilmelde sig.');
      }
      const deadline = signupDeadlineDate(event, slot);
      if (deadline && copenhagenDate() > deadline) {
        throw apiError(409, 'deadline_passed', 'Tilmeldingsfristen er udløbet.');
      }

      const groupMin = Number.isInteger(slot.groupMin) ? slot.groupMin : 1;
      const groupMax = Number.isInteger(slot.groupMax) ? slot.groupMax : 1;
      if (groupSize < groupMin || groupSize > groupMax) {
        throw apiError(400, 'invalid', `Vælg et tal mellem ${groupMin} og ${groupMax}.`);
      }
      const adult = !childMode && data.adult === true;
      if (slot.requiresAdult === true && !adult) {
        throw apiError(400, 'invalid', 'Bekræft at du er over 18 år.');
      }

      const usageRef = eventSlotUsageRef(eventId, slotId);
      // Read the usage document as a transaction lock, but recalculate from
      // signups so legacy records and an admin's waitlist toggle cannot leave
      // the counter stale.
      await transaction.get(usageRef);
      const confirmed = await signupCountForSlot(transaction, eventId, slotId);
      const capacity = Number(slot.capacity) || 0;
      const wouldOverflow = capacity !== 0 && confirmed + groupSize > capacity;
      if (wouldOverflow && !waitlistPreferred) {
        throw apiError(409, 'full', 'Pladsen er fyldt.');
      }
      const waitlist = wouldOverflow;

      transaction.create(signupRef, {
        eventId,
        slotId,
        name,
        adult,
        groupSize,
        ...(audienceGroup ? { audienceGroupId: audienceGroup.id, audienceGroupLabel: audienceGroup.label } : {}),
        created: FieldValue.serverTimestamp(),
        ...(waitlist ? { waitlist: true } : {}),
      });
      transaction.create(contactRef, {
        eventId,
        eventTitle: event.title || '',
        name,
        email,
        ...(email ? { emailNormalized: email } : {}),
        created: FieldValue.serverTimestamp(),
      });
      transaction.set(usageRef, {
        eventId,
        slotId,
        confirmed: waitlist ? confirmed : confirmed + groupSize,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        event,
        slot,
        waitlist,
        audienceGroup,
      };
    });

    let emailSent = false;
    if (email) {
      try {
        const manageLink = await admin.auth().generateSignInWithEmailLink(email, emailLinkSettings('/mine'));
        await sendAppsScriptMail({
          eventTitle: outcome.event.title || '',
          slotLabel: slotLabel(outcome.slot),
          name,
          email,
          adult: !childMode && data.adult === true,
          groupSize,
          audienceGroupLabel: outcome.audienceGroup?.label || '',
          location: outcome.event.location || '',
          dateText: outcome.event.dateText || '',
          eventDate: outcome.slot.date || '',
          timeText: outcome.slot.sublabel || '',
          manageUrl: manageLink,
          waitlist: outcome.waitlist,
        });
        emailSent = true;
      } catch (error) {
        logger.error('signup confirmation delivery failed', {
          signupId: signupRef.id,
          errorMessage: error?.message || 'unknown error',
        });
      }
    }

    res.status(200).json({
      status: outcome.waitlist ? 'waitlist' : 'confirmed',
      signupId: signupRef.id,
      waitlist: outcome.waitlist,
      emailSent,
      message: slotLabel(outcome.slot),
    });
  } catch (error) {
    sendApiError(res, error, 'Tilmeldingen kunne ikke sendes. Prøv igen.');
  }
});

exports.getParentSignups = onRequest({ region: 'europe-west1', cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ status: 'method_not_allowed', message: 'Kun GET er tilladt.' });
    return;
  }

  try {
    const parent = await verifyParentIdentity(req);
    const signups = await loadParentSignups(parent.email);
    res.status(200).json({ signups });
  } catch (error) {
    sendApiError(res, error, 'Kunne ikke hente dine tilmeldinger.');
  }
});

exports.cancelParentSignup = onRequest({ region: 'europe-west1', cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'method_not_allowed', message: 'Kun POST er tilladt.' });
    return;
  }

  try {
    const parent = await verifyParentIdentity(req);
    const signupId = requiredString(requestBody(req).signupId, 'Tilmeldingen', 160);
    const contactRef = db.collection('signupContacts').doc(signupId);
    const signupRef = db.collection('signups').doc(signupId);

    await db.runTransaction(async transaction => {
      const [contactSnap, signupSnap] = await Promise.all([
        transaction.get(contactRef),
        transaction.get(signupRef),
      ]);
      if (!contactSnap.exists || !signupSnap.exists) {
        throw apiError(404, 'not_found', 'Tilmeldingen findes ikke længere.');
      }

      const owner = normalizeEmail(contactSnap.get('emailNormalized') || contactSnap.get('email'));
      if (!owner || owner !== parent.email) {
        throw apiError(404, 'not_found', 'Tilmeldingen findes ikke længere.');
      }

      const usageRef = eventSlotUsageRef(signupSnap.get('eventId'), signupSnap.get('slotId'));
      await transaction.get(usageRef);
      const remainingConfirmed = await signupCountForSlot(
        transaction,
        signupSnap.get('eventId'),
        signupSnap.get('slotId'),
      ) - (signupSnap.get('waitlist') === true ? 0 : Math.max(1, Number(signupSnap.get('groupSize')) || 1));
      if (remainingConfirmed >= 0) {
        transaction.set(usageRef, {
          confirmed: remainingConfirmed,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      transaction.delete(signupRef);
      transaction.delete(contactRef);
    });

    logger.info('parent signup cancelled', { signupId, uid: parent.uid });
    res.status(200).json({ status: 'cancelled' });
  } catch (error) {
    sendApiError(res, error, 'Kunne ikke afmelde tilmeldingen. Prøv igen.');
  }
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const forwardedHost = String(req.get('x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || String(req.get('host') || '').split(',')[0].trim();
  const proto = forwardedProto || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  if (!host) return 'https://havets-helte.web.app';
  return `${proto}://${host}`;
}

function buildShareDescription(event) {
  const parts = [];
  if (event.dateText) parts.push(event.dateText);
  if (event.location) parts.push(event.location);
  if (event.description) parts.push(event.description);
  return parts.join(' · ') || 'Forældrehelte har en opgave klar.';
}

function renderShareHtml({ title, description, imageUrl, shareUrl, redirectUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);
  const safeShareUrl = escapeHtml(shareUrl);
  const safeRedirectUrl = escapeHtml(redirectUrl);

  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${safeShareUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:locale" content="da_DK">
  <meta property="og:site_name" content="Havets Helte">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <link rel="canonical" href="${safeShareUrl}">
  <style>
    body{font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:40px;color:#232323}
    .card{max-width:640px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
    img{width:100%;height:auto;border-radius:16px;display:block;margin:16px 0 20px}
    .meta{color:#7c7c7c;font-size:14px;line-height:1.6}
    .cta{display:inline-block;margin-top:18px;background:#003366;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700}
  </style>
</head>
<body>
  <div class="card">
    <div class="meta">${safeDescription}</div>
    <img src="${safeImageUrl}" alt="${safeTitle}">
    <a class="cta" href="${safeRedirectUrl}">Åbn eventet</a>
  </div>
</body>
</html>`;
}

exports.shareEvent = onRequest({ region: 'europe-west1', cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).send('Kun GET er tilladt.');
    return;
  }

  try {
    const eventId = String(req.query.event || '').trim();
    if (!eventId) {
      res.status(400).send('Mangler event.');
      return;
    }

    const snap = await db.collection('events').doc(eventId).get();
    if (!snap.exists || snap.get('active') === false) {
      res.status(404).send('Opgaven findes ikke længere.');
      return;
    }

    const event = snap.data() || {};
    const origin = getRequestOrigin(req);
    const version = String(req.query.v || '').trim();
    const shareUrl = version
      ? `${origin}/share?event=${encodeURIComponent(eventId)}&v=${encodeURIComponent(version)}`
      : `${origin}/share?event=${encodeURIComponent(eventId)}`;
    const redirectUrl = version
      ? `${origin}/?event=${encodeURIComponent(eventId)}&v=${encodeURIComponent(version)}`
      : `${origin}/?event=${encodeURIComponent(eventId)}`;
    const imageUrl = event.imageUrl || `${origin}/og-sankthans.png`;
    const title = `${event.title || 'Forældrehelte'} · Havets Helte`;
    const description = buildShareDescription(event);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderShareHtml({
      title,
      description,
      imageUrl,
      shareUrl,
      redirectUrl,
    }));
  } catch (error) {
    logger.error('shareEvent failed', error);
    res.status(500).send('Kunne ikke hente delingssiden.');
  }
});
