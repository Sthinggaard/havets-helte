import { doc, getDoc } from 'firebase/firestore';

import { getAppFirestore } from '@/lib/firebase';

export type VolunteerLeaderboardEntry = {
  name: string;
  points: number;
  roleCounts: Record<string, number>;
  signups: number;
};

type LeaderboardRecord = {
  entries?: unknown;
  initialized?: unknown;
  version?: unknown;
};

function parseEntries(value: unknown): VolunteerLeaderboardEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is VolunteerLeaderboardEntry =>
      typeof entry === 'object'
      && entry !== null
      && typeof (entry as VolunteerLeaderboardEntry).name === 'string'
      && typeof (entry as VolunteerLeaderboardEntry).points === 'number'
      && typeof (entry as VolunteerLeaderboardEntry).roleCounts === 'object'
      && typeof (entry as VolunteerLeaderboardEntry).signups === 'number',
    )
    .sort((a, b) => b.points - a.points || b.signups - a.signups);
}

function rebuildUrl(): string {
  return import.meta.env.DEV
    ? 'http://127.0.0.1:5004/havets-helte/europe-west1/volunteerLeaderboard'
    : '/api/volunteer-leaderboard';
}

/**
 * Reads one derived document. When the board is first opened after release,
 * the backend creates that document from existing signups; new signups keep
 * it current through a Firestore trigger.
 */
export async function fetchVolunteerLeaderboard(): Promise<VolunteerLeaderboardEntry[]> {
  const db = await getAppFirestore();
  const leaderboardRef = doc(db, 'leaderboards', 'volunteers');
  try {
    const cached = await getDoc(leaderboardRef);
    const record = cached.data() as LeaderboardRecord | undefined;
    if (record?.initialized === true && record?.version === 3) {
      return parseEntries(record.entries);
    }
  } catch (error) {
    // Public Firestore reads may be blocked by rules or browser transport;
    // the public backend endpoint remains the authoritative fallback.
    console.warn('[volunteer-leaderboard] cached read unavailable, using endpoint', error);
  }

  const response = await fetch(rebuildUrl());
  if (!response.ok) throw new Error('Could not initialize volunteer leaderboard.');
  const payload = await response.json() as { entries?: unknown };
  return parseEntries(payload.entries);
}
