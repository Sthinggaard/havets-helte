import { computed, ref } from 'vue';

import { eventFilterOptions, eventItems } from './events.data';
import type { EventFilterType } from './events.types';

export function useEventsPage() {
  const activeFilter = ref<EventFilterType>('all');
  const selectedEventId = ref(eventItems[0]?.id ?? '');

  const filteredEvents = computed(() =>
    activeFilter.value === 'all'
      ? eventItems
      : eventItems.filter(event => event.type === activeFilter.value),
  );

  const featuredEvent = computed(() => {
    const selected = filteredEvents.value.find(event => event.id === selectedEventId.value);
    return selected ?? filteredEvents.value[0] ?? eventItems[0] ?? null;
  });

  const counts = computed(() =>
    eventFilterOptions.reduce<Record<EventFilterType, number>>((acc, option) => {
      acc[option.id] = option.id === 'all'
        ? eventItems.length
        : eventItems.filter(event => event.type === option.id).length;
      return acc;
    }, {
      all: 0,
      event: 0,
      task: 0,
      shift: 0,
    }),
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
    selectEvent,
    selectFilter,
    selectedEventId,
  };
}

