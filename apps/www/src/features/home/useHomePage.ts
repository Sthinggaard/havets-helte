import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { homeFeedItems, homeHero, homeMineTabs, homeSignups, homeTabs } from './home.data';
import type { HomeCopyLinkTarget, HomeTabId } from './home.types';

function normalizeTab(tab: unknown): HomeTabId {
  return tab === 'task' || tab === 'shift' || tab === 'event' || tab === 'mine' ? tab : 'all';
}

function normalizeEventId(eventId: unknown) {
  return typeof eventId === 'string' ? eventId : '';
}

function typeLabel(type: HomeTabId | 'all') {
  if (type === 'event') return 'Event';
  if (type === 'shift') return 'Vagt';
  if (type === 'task') return 'Opgave';
  return 'Alle';
}

export function useHomePage() {
  const route = useRoute();
  const router = useRouter();
  const activeTab = ref<HomeTabId>(normalizeTab(route.query.tab));
  const mineFilter = ref<HomeTabId>(normalizeTab(route.query.mineFilter));

  const visibleFeed = computed(() =>
    activeTab.value === 'all'
      ? homeFeedItems
      : homeFeedItems.filter(item => item.type === activeTab.value),
  );

  const visibleMine = computed(() =>
    mineFilter.value === 'all' || mineFilter.value === 'mine'
      ? homeSignups
      : homeSignups.filter(item => item.type === mineFilter.value),
  );

  const initialEventId = normalizeEventId(route.query.event);
  const selectedFeedId = ref(
    initialEventId && homeFeedItems.some(item => item.id === initialEventId)
      ? initialEventId
      : visibleFeed.value[0]?.id ?? homeFeedItems[0]?.id ?? '',
  );

  const featuredFeed = computed(
    () =>
      visibleFeed.value.find(item => item.id === selectedFeedId.value)
      ?? visibleFeed.value[0]
      ?? homeFeedItems[0]
      ?? null,
  );

  const mineCounts = computed(() =>
    homeMineTabs.reduce<Record<HomeTabId, number>>((acc, item) => {
      acc[item.id] = item.id === 'all'
        ? homeSignups.length
        : homeSignups.filter(signup => signup.type === item.id).length;
      return acc;
    }, {
      all: 0,
      task: 0,
      shift: 0,
      event: 0,
      mine: homeSignups.length,
    }),
  );

  const feedCounts = computed(() =>
    homeTabs.reduce<Record<HomeTabId, number>>((acc, item) => {
      acc[item.id] = item.id === 'all'
        ? homeFeedItems.length
        : item.id === 'mine'
          ? homeSignups.length
          : homeFeedItems.filter(feed => feed.type === item.id).length;
      return acc;
    }, {
      all: 0,
      task: 0,
      shift: 0,
      event: 0,
      mine: homeSignups.length,
    }),
  );

  function syncRoute() {
    const query: Record<string, string> = {};
    if (activeTab.value !== 'all') query.tab = activeTab.value;
    if (mineFilter.value !== 'all') query.mineFilter = mineFilter.value;
    if (activeTab.value !== 'mine' && selectedFeedId.value) query.event = selectedFeedId.value;
    router.replace({ query });
  }

  function setActiveTab(tab: HomeTabId) {
    activeTab.value = tab;
    if (tab !== 'mine') {
      const nextSelected = visibleFeed.value[0] ?? homeFeedItems[0] ?? null;
      selectedFeedId.value = nextSelected?.id ?? '';
    }
    syncRoute();
  }

  function setMineFilter(tab: HomeTabId) {
    mineFilter.value = tab;
    syncRoute();
  }

  function selectFeed(id: string) {
    selectedFeedId.value = id;
    syncRoute();
  }

  function feedHref(itemId: string) {
    const item = homeFeedItems.find(feed => feed.id === itemId);
    if (!item) return '/';
    return router.resolve({
      path: item.ctaRoute,
      query: item.id ? { event: item.id } : undefined,
    }).href;
  }

  function selectNextVisibleFeed() {
    const currentIndex = visibleFeed.value.findIndex(item => item.id === selectedFeedId.value);
    const nextItem = visibleFeed.value[currentIndex + 1] ?? visibleFeed.value[0] ?? null;
    if (nextItem) selectFeed(nextItem.id);
  }

  function getCopyTarget(itemId = selectedFeedId.value): HomeCopyLinkTarget {
    return {
      tab: activeTab.value,
      eventId: itemId,
    };
  }

  function routeHref(target: HomeCopyLinkTarget) {
    const query: Record<string, string> = {};
    if (target.tab !== 'all') query.tab = target.tab;
    if (target.eventId) query.event = target.eventId;
    return router.resolve({ path: '/', query }).href;
  }

  function copyLink(itemId = selectedFeedId.value) {
    const href = `${window.location.origin}${routeHref({ tab: activeTab.value, eventId: itemId })}`;
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(href);
    }
    const textarea = document.createElement('textarea');
    textarea.value = href;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
  }

  function facebookShareUrl(itemId = selectedFeedId.value) {
    const href = `${window.location.origin}${routeHref({ tab: activeTab.value, eventId: itemId })}`;
    const url = new URL('https://www.facebook.com/sharer/sharer.php');
    url.searchParams.set('u', href);
    return url.toString();
  }

  function openFacebookShare(itemId = selectedFeedId.value) {
    window.open(facebookShareUrl(itemId), '_blank', 'noopener,noreferrer');
  }

  return {
    activeTab,
    feedCounts,
    featuredFeed,
    facebookShareUrl,
    getCopyTarget,
    homeFeedItems,
    homeHero: homeHero,
    homeMineTabs,
    homeSignups,
    homeTabs,
    mineCounts,
    mineFilter,
    routeHref,
    feedHref,
    selectedFeedId,
    selectFeed,
    selectNextVisibleFeed,
    setActiveTab,
    setMineFilter,
    typeLabel,
    visibleFeed,
    visibleMine,
    copyLink,
    openFacebookShare,
  };
}
