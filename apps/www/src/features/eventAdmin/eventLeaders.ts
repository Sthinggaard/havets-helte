import { getFunction } from '@/lib/functionApi';
import { getAppAuth } from '@/lib/firebase';

export type EventLeader = { id: string; name: string };
export type AvailableEventLeader = EventLeader & { email: string };

export function normalizeEventLeaders(value: unknown): EventLeader[] {
  if (!Array.isArray(value)) return [];
  const leaders = new Map<string, EventLeader>();
  for (const item of value) {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') continue;
    const id = item.id.trim();
    const name = item.name.trim();
    if (id && name && !leaders.has(id)) leaders.set(id, { id, name });
  }
  return [...leaders.values()];
}

export async function fetchAvailableEventLeaders(): Promise<AvailableEventLeader[]> {
  const auth = await getAppAuth();
  if (!auth.currentUser) throw new Error('Log ind som leder for at vælge ansvarlige.');
  const user = auth.currentUser;
  const request = async (refresh = false) => {
    const response = await getFunction<{ leaders: AvailableEventLeader[] }>(
      'getEventLeaders', '/api/event-leaders', await user.getIdToken(refresh),
    );
    return response.leaders;
  };
  try {
    return await request();
  } catch (error) {
    if ((error as { status?: number })?.status !== 401) throw error;
    return request(true);
  }
}
