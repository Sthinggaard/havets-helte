import { useRouter } from 'vue-router';

import { homeFeedItems, homeHero } from './home.data';
import type { HomeTabId } from './home.types';

function typeLabel(type: HomeTabId) {
  if (type === 'event') return 'Event';
  if (type === 'shift') return 'Vagt';
  if (type === 'task') return 'Opgave';
  return 'Mine tilmeldinger';
}

export function useHomePage() {
  const router = useRouter();

  function feedHref(itemId: string) {
    const item = homeFeedItems.find(feed => feed.id === itemId);
    if (!item) return '/';
    return router.resolve({
      path: item.ctaRoute,
      query: item.id ? { event: item.id } : undefined,
    }).href;
  }

  return {
    homeFeedItems,
    homeHero,
    feedHref,
    typeLabel,
  };
}
