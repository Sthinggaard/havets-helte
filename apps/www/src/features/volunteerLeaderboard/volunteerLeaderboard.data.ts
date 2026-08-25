import { doc, getDoc } from 'firebase/firestore';

import { getAppFirestore } from '@/lib/firebase';

export type VolunteerLeaderboardEntry = {
  name: string;
  signups: number;
};

type LeaderboardRecord = {
  entries?: unknown;
  initialized?: unknown;
};

function parseEntries(value: unknown): VolunteerLeaderboardEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is VolunteerLeaderboardEntry =>
      typeof entry === 'object'
      && entry !== null
      && typeof (entry as VolunteerLeaderboardEntry).name === 'string'
      && typeof (entry as VolunteerLeaderboardEntry).signups === 'number',
    )
    .sort((a, b) => b.signups - a.signups || a.name.localeCompare(b.name, 'da-DK'));
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
  const cached = await getDoc(leaderboardRef);
  const record = cached.data() as LeaderboardRecord | undefined;
  if (record?.initialized === true) {
    return parseEntries(record.entries);
  }

  const response = await fetch(rebuildUrl());
  if (!response.ok) throw new Error('Could not initialize volunteer leaderboard.');
  const payload = await response.json() as { entries?: unknown };
  return parseEntries(payload.entries);
}
