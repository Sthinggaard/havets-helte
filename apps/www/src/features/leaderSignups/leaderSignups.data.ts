import { collection, documentId, getDocs, query, where } from 'firebase/firestore';

import { getAppAuth, getAppFirestore } from '@/lib/firebase';

export type LeaderSignup = {
  id: string;
  eventId: string;
  eventType: 'timed' | 'task' | 'event' | string;
  eventTitle: string;
  dateText: string;
  location: string;
  slotLabel: string;
  waitlist: boolean;
  groupSize: number;
  createdAt: number;
};

async function currentLeaderEmail() {
  const auth = await getAppAuth();
  const email = auth.currentUser?.email?.trim().toLowerCase();
  if (!email) throw new Error('Du skal være logget ind som leder.');
  return email;
}

export async function loadLeaderSignups() {
  const [db, email] = await Promise.all([getAppFirestore(), currentLeaderEmail()]);
  const [normalizedContacts, legacyContacts] = await Promise.all([
    getDocs(query(collection(db, 'signupContacts'), where('emailNormalized', '==', email))),
    getDocs(query(collection(db, 'signupContacts'), where('email', '==', email))),
  ]);
  const contactIds = [...new Set([
    ...normalizedContacts.docs.map(doc => doc.id),
    ...legacyContacts.docs.map(doc => doc.id),
  ])];
  if (contactIds.length === 0) return { signups: [] as LeaderSignup[] };

  const signupDocs = (await Promise.all(chunk(contactIds, 30).map(ids =>
    getDocs(query(collection(db, 'signups'), where(documentId(), 'in', ids))),
  ))).flatMap(snapshot => snapshot.docs);
  const eventIds = [...new Set(signupDocs.map(doc => String(doc.get('eventId') || '')).filter(Boolean))];
  const eventDocs = (await Promise.all(chunk(eventIds, 30).map(ids =>
    getDocs(query(collection(db, 'events'), where(documentId(), 'in', ids))),
  ))).flatMap(snapshot => snapshot.docs);
  const events = new Map(eventDocs.map(doc => [doc.id, doc.data()]));

  const signups = signupDocs.map(doc => {
    const signup = doc.data();
    const event = events.get(String(signup.eventId)) || {};
    const slot = Array.isArray(event.slots)
      ? event.slots.find((item: { id?: string }) => item?.id === signup.slotId)
      : null;
    const created = signup.created;
    return {
      id: doc.id,
      eventId: String(signup.eventId || ''),
      eventType: event.type || 'event',
      eventTitle: event.title || 'Arrangement',
      dateText: event.dateText || '',
      location: event.location || '',
      slotLabel: slot?.sublabel ? `${slot.label || ''} · ${slot.sublabel}`.trim() : String(slot?.label || ''),
      waitlist: signup.waitlist === true,
      groupSize: Math.max(1, Number(signup.groupSize) || 1),
      createdAt: created?.toMillis?.() || 0,
    } satisfies LeaderSignup;
  }).sort((a, b) => b.createdAt - a.createdAt);

  return { signups };
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}
