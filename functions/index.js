const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');
const { onRequest } = require('firebase-functions/v2/https');
const { FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();

const db = admin.firestore();

class SignupError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function slotLabel(slot) {
  return slot?.sublabel ? `${slot.label} · ${slot.sublabel}` : slot?.label || '';
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body;
}

async function verifyOptionalUser(req) {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    logger.warn('Invalid signup token', error);
    return null;
  }
}

function normalizePayload(body) {
  const eventId = String(body.eventId || '').trim();
  const slotId = String(body.slotId || '').trim();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const adult = !!body.adult;
  const childMode = !!body.childMode;
  const waitlistPreferred = !!body.waitlistPreferred;
  const rawGroupSize = Number.parseInt(body.groupSize, 10);
  const groupSize = Number.isFinite(rawGroupSize) ? rawGroupSize : 1;

  if (!eventId) throw new SignupError('invalid', 'Mangler eventId.');
  if (!slotId) throw new SignupError('invalid', 'Mangler slotId.');
  if (!name) throw new SignupError('invalid', 'Navn mangler.');
  if (!childMode) {
    if (!email) throw new SignupError('invalid', 'Email mangler.');
    if (!email.includes('@')) throw new SignupError('invalid', 'Email er ugyldig.');
  }
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    throw new SignupError('invalid', 'Antal deltagere er ugyldigt.');
  }

  return { eventId, slotId, name, email, adult, childMode, waitlistPreferred, groupSize };
}

exports.submitSignup = onRequest({ region: 'europe-west1', cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'invalid', message: 'Kun POST er tilladt.' });
    return;
  }

  try {
    const body = parseBody(req);
    const payload = normalizePayload(body);
    const verifiedUser = await verifyOptionalUser(req);
    const signupRef = db.collection('signups').doc();
    const contactRef = db.collection('signupContacts').doc(signupRef.id);
    const cancelToken = payload.childMode || !payload.email
      ? ''
      : (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : signupRef.id);

    const result = await db.runTransaction(async transaction => {
      const eventRef = db.collection('events').doc(payload.eventId);
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists || eventSnap.get('active') === false) {
        throw new SignupError('not_found', 'Opgaven findes ikke længere.', 404);
      }

      const event = eventSnap.data();
      const slot = (event.slots || []).find(item => item.id === payload.slotId);
      if (!slot) {
        throw new SignupError('not_found', 'Pladsen findes ikke længere.', 404);
      }

      const groupMin = Number.isInteger(slot.groupMin) ? slot.groupMin : 1;
      const groupMax = Number.isInteger(slot.groupMax) ? slot.groupMax : 1;
      if (payload.groupSize < groupMin || payload.groupSize > groupMax) {
        throw new SignupError('invalid', 'Antal deltagere er uden for tilladt interval.');
      }

      const slotSignupQuery = db.collection('signups')
        .where('eventId', '==', payload.eventId)
        .where('slotId', '==', payload.slotId);
      const slotSignupSnap = await transaction.get(slotSignupQuery);
      const taken = slotSignupSnap.docs.reduce((sum, docSnap) => {
        const data = docSnap.data();
        return data.waitlist ? sum : sum + (data.groupSize || 1);
      }, 0);

      const wouldOverflow = slot.capacity !== 0 && taken + payload.groupSize > slot.capacity;
      if (wouldOverflow && !payload.waitlistPreferred) {
        throw new SignupError('full', 'Pladsen er fyldt.', 409);
      }

      const waitlist = wouldOverflow;
      const signupData = {
        eventId: payload.eventId,
        slotId: payload.slotId,
        name: payload.name,
        adult: payload.childMode ? false : payload.adult,
        groupSize: payload.groupSize,
        created: FieldValue.serverTimestamp(),
        ...(waitlist ? { waitlist: true } : {}),
        ...(verifiedUser ? { uid: verifiedUser.uid } : {}),
      };

      const contactData = {
        eventId: payload.eventId,
        eventTitle: event.title || '',
        name: payload.name,
        email: payload.childMode ? '' : payload.email,
        cancelToken,
        created: FieldValue.serverTimestamp(),
        ...(verifiedUser ? { uid: verifiedUser.uid } : {}),
      };

      transaction.set(signupRef, signupData);
      transaction.set(contactRef, contactData);

      return {
        status: waitlist ? 'waitlist' : 'confirmed',
        signupId: signupRef.id,
        waitlist,
        cancelToken,
        eventTitle: event.title || '',
        slotLabel: slotLabel(slot),
      };
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof SignupError) {
      res.status(error.status).json({ status: error.code, message: error.message });
      return;
    }
    logger.error('submitSignup failed', error);
    res.status(500).json({ status: 'error', message: 'Serverfejl ved tilmelding.' });
  }
});
