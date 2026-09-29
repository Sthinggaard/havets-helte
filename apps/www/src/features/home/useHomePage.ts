import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, count, getAggregateFromServer, query, sum, where } from 'firebase/firestore';

import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventSlot } from '@/features/eventAdmin/eventAdmin.types';
import { getAppFirestore } from '@/lib/firebase';

import { homeHero, toHomeFeedItems } from './home.data';
import type { HomeFeedItem, HomeTabId } from './home.types';

function typeLabel(type: HomeFeedItem['type']) {
  if (type === 'event') return 'Event';
  if (type === 'shift') return 'Vagt';
  if (type === 'task') return 'Opgave';
  return 'Mine tilmeldinger';
}

function slotsForFeedItem(event: AdminEvent, item: HomeFeedItem): EventSlot[] {
  const types = item.parentTypes ?? [item.type === 'event' ? 'signup' : item.type];
  return event.slots.filter(slot => types.includes(slot.componentType as typeof types[number]));
}

async function confirmedSignupCount(eventId: string, slotIds: string[]) {
  const db = await getAppFirestore();
  let allCount = 0;
  let allUnits = 0;
  let waitlistCount = 0;
  let waitlistUnits = 0;

  for (let index = 0; index < slotIds.length; index += 30) {
    const slotBatch = slotIds.slice(index, index + 30);
    const base = [where('eventId', '==', eventId), where('slotId', 'in', slotBatch)];
    const [all, waitlist] = await Promise.all([
      getAggregateFromServer(query(collection(db, 'signups'), ...base), {
        count: count(),
        units: sum('groupSize'),
      }),
      getAggregateFromServer(query(collection(db, 'signups'), ...base, where('waitlist', '==', true)), {
        count: count(),
        units: sum('groupSize'),
      }),
    ]);
    allCount += all.data().count;
    allUnits += all.data().units;
    waitlistCount += waitlist.data().count;
    waitlistUnits += waitlist.data().units;
  }

  return Math.max(0, Math.max(allUnits, allCount) - Math.max(waitlistUnits, waitlistCount));
}

export function useHomePage() {
  const route = useRoute();
  const router = useRouter();
  const items = ref<HomeFeedItem[]>([]);
  const loading = ref(true);
  const activeTab = computed<HomeTabId>(() =>
    route.query.tab === 'scout-signups' || route.query.tab === 'event' ? 'scout-signups' : 'parents',
  );
  function isLivePublic(event: AdminEvent) {
    return event.active;
  }

  onMounted(async () => {
    try {
      const live = (await fetchAllAdminEvents()).filter(isLivePublic);
      const nextItems = live
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, 'da'))
        .flatMap(toHomeFeedItems);
      await Promise.all(nextItems.map(async item => {
        const event = live.find(candidate => candidate.id === item.eventId);
        if (!event || item.parentTypes?.length === 0 || item.type === 'event') return;
        const slots = slotsForFeedItem(event, item);
        if (!slots.length || slots.some(slot => slot.capacity === 0)) return;
        try {
          item.confirmedCount = await confirmedSignupCount(event.id, slots.map(slot => slot.id));
        } catch (error) {
          console.error(`[home] failed to count signups for ${event.id}`, error);
        }
      }));
      items.value = nextItems;
    } catch (error) {
      console.error('[home] live load failed', error);
    } finally {
      loading.value = false;
    }
  });

  function feedHref(item: HomeFeedItem) {
    return router.resolve({
      path: item.ctaRoute,
      query: item.eventId || item.id ? { event: item.eventId || item.id } : undefined,
    }).href;
  }

  return {
    activeTab,
    homeFeedItems: computed(() => items.value.filter(item =>
      activeTab.value === 'scout-signups' ? item.type === 'event' : item.type !== 'event',
    )),
    homeHero,
    feedHref,
    loading,
    typeLabel,
  };
}
