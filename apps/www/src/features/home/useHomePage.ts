import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent } from '@/features/eventAdmin/eventAdmin.types';

import { homeHero, homeTabs, toHomeFeedItems } from './home.data';
import type { HomeFeedItem, HomeTabId } from './home.types';

function typeLabel(type: HomeFeedItem['type']) {
  if (type === 'event') return 'Event';
  if (type === 'shift') return 'Vagt';
  if (type === 'task') return 'Opgave';
  return 'Mine tilmeldinger';
}

export function useHomePage() {
  const route = useRoute();
  const router = useRouter();
  const items = ref<HomeFeedItem[]>([]);
  const loading = ref(true);
  const activeTab = computed<HomeTabId>(() =>
    route.query.tab === 'scout-signups' || route.query.tab === 'event' ? 'scout-signups' : 'parents',
  );
  const counts = computed<Record<HomeTabId, number>>(() => ({
    parents: items.value.filter(item => item.type !== 'event').length,
    'scout-signups': items.value.filter(item => item.type === 'event').length,
  }));

  function isLivePublic(event: AdminEvent) {
    return event.active;
  }

  onMounted(async () => {
    try {
      const live = (await fetchAllAdminEvents()).filter(isLivePublic);
      items.value = live
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, 'da'))
        .flatMap(toHomeFeedItems);
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

  function selectTab(tab: HomeTabId) {
    router.replace({ query: { ...route.query, tab } });
  }

  return {
    activeTab,
    counts,
    homeFeedItems: computed(() => items.value.filter(item =>
      activeTab.value === 'scout-signups' ? item.type === 'event' : item.type !== 'event',
    )),
    homeHero,
    feedHref,
    homeTabs,
    loading,
    selectTab,
    typeLabel,
  };
}
