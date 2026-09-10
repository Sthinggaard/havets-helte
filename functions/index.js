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
  res.status(500).json({ status: 'error', message: fallbackMessage });
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
        eventTitle: event.title || contact.get('eventTitle') || 'Arrangement',
        dateText: event.dateText || '',
        location: event.location || '',
        slotLabel: slotLabel(slot || {}),
        waitlist: signup.waitlist === true,
        groupSize: Math.max(1, Number(signup.groupSize) || 1),
        createdAt: contact.get('created')?.toMillis?.() || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

function leaderboardNameKey(name) {
  return normalizeName(name).toLocaleLowerCase('da-DK');
}

function sortedEntries(entries) {
  return [...entries.values()]
    .filter(entry => entry.signups > 0)
    .sort((a, b) => b.signups - a.signups || a.name.localeCompare(b.name, 'da-DK'));
}

async function volunteerContribution(signup, eventCache) {
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
  if (!slot || (slot.kind ?? 'volunteer') !== 'volunteer') return null;

  return { key: leaderboardNameKey(name), name };
}

async function rebuildVolunteerLeaderboard() {
  const [eventsSnap, signupsSnap] = await Promise.all([
    db.collection('events').get(),
    db.collection('signups').get(),
  ]);
  const events = new Map(eventsSnap.docs.map(eventDoc => [eventDoc.id, eventDoc.data()]));
  const entries = new Map();

  for (const signupDoc of signupsSnap.docs) {
    const contribution = await volunteerContribution(signupDoc.data(), events);
    if (!contribution) continue;
    const current = entries.get(contribution.key) || { name: contribution.name, signups: 0 };
    current.signups += 1;
    entries.set(contribution.key, current);
  }

  const leaderboard = sortedEntries(entries);
  await leaderboardRef.set({
    entries: leaderboard,
    initialized: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
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
    const entries = cachedData?.initialized === true
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
  const [before, after] = await Promise.all([
    volunteerContribution(event.data.before.exists ? event.data.before.data() : null, eventCache),
    volunteerContribution(event.data.after.exists ? event.data.after.data() : null, eventCache),
  ]);
  if (before?.key === after?.key) return;

  await db.runTransaction(async transaction => {
    const leaderboardSnap = await transaction.get(leaderboardRef);
    const stored = leaderboardSnap.data();
    const entries = new Map(
      Array.isArray(stored?.entries)
        ? stored.entries
          .filter(entry => entry && typeof entry.name === 'string' && typeof entry.signups === 'number')
          .map(entry => [leaderboardNameKey(entry.name), { name: entry.name, signups: entry.signups }])
        : [],
    );

    for (const contribution of [before, after]) {
      if (!contribution) continue;
      const current = entries.get(contribution.key) || { name: contribution.name, signups: 0 };
      current.signups += contribution === before ? -1 : 1;
      if (current.signups > 0) entries.set(contribution.key, current);
      else entries.delete(contribution.key);
    }

    transaction.set(leaderboardRef, {
      entries: sortedEntries(entries),
      initialized: stored?.initialized === true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
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
    if (!childMode && isAdminEmail(email)) {
      throw apiError(400, 'invalid', 'Ledere tilmelder sig via lederportalen.');
    }
    const groupSize = Number(data.groupSize);
    if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
      throw apiError(400, 'invalid', 'Antal deltagere er ugyldigt.');
    }
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
          location: outcome.event.location || '',
          dateText: outcome.event.dateText || '',
          manageUrl: manageLink,
          waitlist: outcome.waitlist,
        });
        emailSent = true;
      } catch (error) {
        logger.error('signup confirmation delivery failed', { signupId: signupRef.id, message: error?.message || 'unknown error' });
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
