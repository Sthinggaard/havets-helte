import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent } from '@/features/eventAdmin/eventAdmin.types';

import { homeHero, toHomeFeedItem } from './home.data';
import type { HomeFeedItem, HomeTabId } from './home.types';

function typeLabel(type: HomeTabId) {
  if (type === 'event') return 'Event';
  if (type === 'shift') return 'Vagt';
  if (type === 'task') return 'Opgave';
  return 'Mine tilmeldinger';
}

export function useHomePage() {
  const router = useRouter();
  const items = ref<HomeFeedItem[]>([]);
  const loading = ref(true);

  function isLivePublic(event: AdminEvent) {
    return event.active;
  }

  onMounted(async () => {
    try {
      const live = (await fetchAllAdminEvents()).filter(isLivePublic);
      items.value = live
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, 'da'))
        .map(toHomeFeedItem);
    } catch (error) {
      console.error('[home] live load failed', error);
    } finally {
      loading.value = false;
    }
  });

  function feedHref(itemId: string) {
    const item = items.value.find(feed => feed.id === itemId);
    if (!item) return '/';
    return router.resolve({
      path: item.ctaRoute,
      query: item.id ? { event: item.id } : undefined,
    }).href;
  }

  return {
    homeFeedItems: computed(() => items.value),
    homeHero,
    feedHref,
    loading,
    typeLabel,
  };
}
