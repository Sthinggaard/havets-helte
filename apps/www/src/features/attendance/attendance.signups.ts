import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getAppFirestore } from '@/lib/firebase';
import type { AttendanceRecord, Meeting } from './attendance.types';
import type { CalendarEvent, CalendarSignup } from './attendance.events';
import { createAdminEventFromRecord } from '../eventAdmin/eventAdmin.data';
import { calendarEventOccurrences } from './attendance.events';
import { fromIsoDate, isAttendanceDate } from './attendanceCalendar';

export interface AttendanceSignup {
  id: string;
  eventId: string;
  slotId: string;
  name: string;
  waitlist?: boolean;
  groupSize?: number;
}

export async function fetchAttendanceSignups(eventId: string, slotId: string): Promise<AttendanceSignup[]> {
  const db = await getAppFirestore();
  const snapshot = await getDocs(query(collection(db, 'signups'), where('eventId', '==', eventId), where('slotId', '==', slotId)));
  return snapshot.docs.map(item => {
    const data = item.data();
    return { id: item.id, eventId, slotId, name: typeof data.name === 'string' ? data.name : '', waitlist: data.waitlist === true,
      groupSize: Number.isInteger(data.groupSize) && data.groupSize > 0 ? data.groupSize : 1 };
  });
}

export function signupAttendanceTarget(event: CalendarEvent, slot: CalendarSignup, signups: AttendanceSignup[]) {
  const expectedMembers: AttendanceRecord['expectedMembers'] = signups
    .filter(signup => signup.eventId === event.id && signup.slotId === slot.id && signup.waitlist !== true)
    .map(signup => ({
      // Signup IDs deliberately never masquerade as roster member IDs.
      id: `signup:${signup.id}`,
      name: `${signup.name?.trim() || 'Ukendt tilmeldt'}${(signup.groupSize ?? 1) > 1 ? ` · ${signup.groupSize} deltagere (samlet tilmelding)` : ''}`,
    })).sort((a, b) => a.name.localeCompare(b.name, 'da'));
  const meeting: Meeting = {
    id: `signup-attendance:${JSON.stringify([event.id, slot.id, event.date])}`,
    source: 'signup', eventId: event.id, slotId: slot.id,
    date: event.date, time: slot.time, title: `${event.title} · ${slot.label}`,
    branchId: '__signup__', weekday: fromIsoDate(event.date).toLocaleDateString('da-DK', { weekday: 'long' }),
    location: event.location, capacity: expectedMembers.length, summary: '',
  };
  return { meeting, expectedMembers };
}

export async function fetchSignupAttendance(eventId: string, slotId: string, date: string) {
  if (!eventId || !slotId || !isAttendanceDate(date)) throw new Error('Vælg en gyldig tilmelding og dato fra kalenderen.');
  const db = await getAppFirestore();
  const snapshot = await getDoc(doc(db, 'events', eventId));
  if (!snapshot.exists()) throw new Error('Arrangementet findes ikke længere.');
  const event = calendarEventOccurrences([createAdminEventFromRecord({ ...snapshot.data(), id: snapshot.id })])
    .find(item => item.date === date);
  const slot = event?.signups.find(item => item.id === slotId && !item.external);
  if (!event || !slot) throw new Error('Tilmeldingen er ikke tilgængelig på denne dato.');
  return signupAttendanceTarget(event, slot, await fetchAttendanceSignups(eventId, slotId));
}
