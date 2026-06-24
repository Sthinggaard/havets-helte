import { computed, onMounted, ref } from 'vue';

import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventType } from '@/features/eventAdmin/eventAdmin.types';
import { eventFilterOptions, eventItems } from './events.data';
import type { EventFilterType, EventItem } from './events.types';

const FALLBACK_IMAGE = '/og-sankthans.png';

function filterTypeForEvent(type: EventType): Exclude<EventFilterType, 'all'> {
  if (type === 'task') return 'task';
  if (type === 'event') return 'event';
  return 'shift'; // 'timed'
}

function spotsLabel(event: AdminEvent): string {
  if (!event.slots.length) return 'Ingen pladser';
  if (event.slots.some(slot => slot.capacity === 0)) return 'Ubegrænset';
  const total = event.slots.reduce((sum, slot) => sum + slot.capacity, 0);
  return `${total} ${total === 1 ? 'plads' : 'pladser'}`;
}

function toEventItem(event: AdminEvent): EventItem {
  return {
    id: event.id,
    type: filterTypeForEvent(event.type),
    title: event.title,
    dateText: event.dateText,
    location: event.location,
    spots: spotsLabel(event),
    summary: event.description,
    image: event.imageUrl || FALLBACK_IMAGE,
  };
}

export function useEventsPage() {
  const activeFilter = ref<EventFilterType>('all');
  const selectedEventId = ref('');
  // Start from the static seed so the page renders instantly, then replace with
  // live Firestore data once it loads (or keep the seed if the collection is
  // empty, so the public page never goes blank pre-seed).
  const items = ref<EventItem[]>(eventItems);
  const loading = ref(true);

  onMounted(async () => {
    try {
      const all = (await fetchAllAdminEvents()).filter(event => event.active);
      if (all.length) {
        items.value = all
          .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, 'da'))
          .map(toEventItem);
      }
    } catch (error) {
      console.error('[events] live load failed, using static seed', error);
    } finally {
      loading.value = false;
    }
    if (!items.value.some(event => event.id === selectedEventId.value)) {
      selectedEventId.value = items.value[0]?.id ?? '';
    }
  });

  const filteredEvents = computed(() =>
    activeFilter.value === 'all' ? items.value : items.value.filter(event => event.type === activeFilter.value),
  );

  const featuredEvent = computed(() => {
    const selected = filteredEvents.value.find(event => event.id === selectedEventId.value);
    return selected ?? filteredEvents.value[0] ?? items.value[0] ?? null;
  });

  const counts = computed(() =>
    eventFilterOptions.reduce<Record<EventFilterType, number>>(
      (acc, option) => {
        acc[option.id] = option.id === 'all' ? items.value.length : items.value.filter(event => event.type === option.id).length;
        return acc;
      },
      { all: 0, event: 0, task: 0, shift: 0 },
    ),
  );

  function selectFilter(filter: EventFilterType) {
    activeFilter.value = filter;
    const nextSelected = filteredEvents.value[0];
    if (!nextSelected) {
      selectedEventId.value = '';
      return;
    }
    if (!filteredEvents.value.some(event => event.id === selectedEventId.value)) {
      selectedEventId.value = nextSelected.id;
    }
  }

  function selectEvent(eventId: string) {
    selectedEventId.value = eventId;
  }

  return {
    activeFilter,
    counts,
    eventFilterOptions,
    featuredEvent,
    filteredEvents,
    loading,
    selectEvent,
    selectFilter,
    selectedEventId,
  };
}
