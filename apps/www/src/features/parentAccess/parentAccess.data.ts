import { getFunction, postFunction } from '@/lib/functionApi';
import { getAppAuth } from '@/lib/firebase';

export type ParentSignup = {
  id: string;
  eventId: string;
  eventType: 'timed' | 'task' | 'event' | string;
  eventTitle: string;
  dateText: string;
  location: string;
  slotLabel: string;
  audienceGroupLabel: string;
  waitlist: boolean;
  groupSize: number;
  createdAt: number;
};

export async function requestParentAccessLink(email: string, returnTo = '/mine') {
  return postFunction<{ status: 'sent'; message: string }>(
    'requestParentAccessLink',
    '/api/parent-access-link',
    { email, returnTo },
  );
}

async function idToken() {
  const auth = await getAppAuth();
  if (!auth.currentUser) throw new Error('Du skal åbne adgangslinket først.');
  return auth.currentUser.getIdToken();
}

export async function loadParentSignups() {
  return getFunction<{ signups: ParentSignup[] }>(
    'getParentSignups',
    '/api/my-signups',
    await idToken(),
  );
}

export async function cancelParentSignup(signupId: string) {
  return postFunction<{ status: 'cancelled' }>(
    'cancelParentSignup',
    '/api/cancel-signup',
    { signupId },
    await idToken(),
  );
}
