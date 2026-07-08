import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

import { getAppFirestore } from './firebase';

export type SignupRequestPayload = {
  eventId: string;
  slotId: string;
  name: string;
  email: string;
  adult: boolean;
  childMode: boolean;
  groupSize: number;
  waitlistPreferred: boolean;
};

export type SignupResponsePayload = {
  cancelToken?: string;
  signupId?: string;
  status?: 'confirmed' | 'waitlist' | 'invalid' | 'not_found' | 'full' | 'error';
  waitlist?: boolean;
  message?: string;
};

type SignupError = Error & { code?: string };

function signupError(code: string, message: string): SignupError {
  const error = new Error(message) as SignupError;
  error.code = code;
  return error;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function submitSignupRequest(payload: SignupRequestPayload): Promise<SignupResponsePayload> {
  const eventId = payload.eventId.trim();
  const slotId = payload.slotId.trim();
  const name = payload.name.trim();
  const email = payload.childMode ? '' : payload.email.trim();
  const groupSize = Number.isInteger(payload.groupSize) ? payload.groupSize : 1;

  if (!eventId) throw signupError('invalid', 'Mangler eventId.');
  if (!slotId) throw signupError('invalid', 'Mangler slotId.');
  if (!name) throw signupError('invalid', 'Navn mangler.');
  if (!payload.childMode) {
    if (!email) throw signupError('invalid', 'Email mangler.');
    if (!email.includes('@')) throw signupError('invalid', 'Email er ugyldig.');
  }
  if (groupSize < 1) throw signupError('invalid', 'Antal deltagere er ugyldigt.');

  const db = await getAppFirestore();

  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists() || eventSnap.get('active') === false) {
    throw signupError('not_found', 'Opgaven findes ikke længere.');
  }

  const event = eventSnap.data() as { title?: string; slots?: any[] };
  const slot = (event.slots || []).find(item => item.id === slotId);
  if (!slot) {
    throw signupError('not_found', 'Pladsen findes ikke længere.');
  }

  const groupMin = Number.isInteger(slot.groupMin) ? slot.groupMin : 1;
  const groupMax = Number.isInteger(slot.groupMax) ? slot.groupMax : 1;
  if (groupSize < groupMin || groupSize > groupMax) {
    throw signupError('invalid', 'Antal deltagere er uden for tilladt interval.');
  }

  const slotSignupSnap = await getDocs(
    query(collection(db, 'signups'), where('eventId', '==', eventId), where('slotId', '==', slotId)),
  );
  const taken = slotSignupSnap.docs.reduce((sum, docSnap) => {
    const data = docSnap.data();
    return data.waitlist ? sum : sum + (data.groupSize || 1);
  }, 0);

  const wouldOverflow = slot.capacity !== 0 && taken + groupSize > slot.capacity;
  if (wouldOverflow && !payload.waitlistPreferred) {
    throw signupError('full', 'Pladsen er fyldt.');
  }

  const waitlist = wouldOverflow;
  const signupId = newId();
  const cancelToken = payload.childMode || !email ? '' : newId();

  const signupData: Record<string, unknown> = {
    eventId,
    slotId,
    name,
    adult: payload.childMode ? false : payload.adult,
    groupSize,
    created: serverTimestamp(),
    ...(waitlist ? { waitlist: true } : {}),
  };

  const contactData: Record<string, unknown> = {
    eventId,
    eventTitle: event.title || '',
    name,
    email,
    cancelToken,
    created: serverTimestamp(),
  };

  await setDoc(doc(db, 'signups', signupId), signupData);
  await setDoc(doc(db, 'signupContacts', signupId), contactData);

  const slotLabel = slot.sublabel ? `${slot.label} · ${slot.sublabel}` : slot.label || '';

  return {
    status: waitlist ? 'waitlist' : 'confirmed',
    signupId,
    waitlist,
    cancelToken,
    message: slotLabel,
  };
}
