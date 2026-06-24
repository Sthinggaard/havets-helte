<template>
  <div class="page-stack events-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Arrangementer</p>
            <h1 class="page-title">Event-oversigt</h1>
          </div>

          <div class="filter-tabs filter-tabs--tight" role="tablist" aria-label="Event filter">
            <button
              v-for="option in eventFilterOptions"
              :key="option.id"
              type="button"
              class="filter-tab"
              :class="{ active: activeFilter === option.id }"
              @click="selectFilter(option.id)"
            >
              {{ option.label }}
              <span class="filter-tab-count">{{ counts[option.id] }}</span>
            </button>
          </div>
        </div>
      </template>

      <section v-if="featuredEvent" class="featured-event">
        <img class="featured-event-image" :src="featuredEvent.image" :alt="featuredEvent.title" />
        <div class="featured-event-body">
          <div class="featured-event-head">
            <div>
              <p class="card-kicker">Fremhævet</p>
              <h2 class="featured-event-title">{{ featuredEvent.title }}</h2>
            </div>
            <span class="pill">{{ featuredEvent.spots }}</span>
          </div>

          <p class="lead featured-event-copy">{{ featuredEvent.summary }}</p>

          <div class="info-strip">
            <span class="info-chip">{{ featuredEvent.dateText }}</span>
            <span class="info-chip">{{ featuredEvent.location }}</span>
            <span class="info-chip">{{ eventTypeLabel(featuredEvent.type) }}</span>
          </div>

          <div class="detail-actions">
            <button v-if="isAdmin" type="button" class="btn-action btn-action--primary" @click="editEvent(featuredEvent)">
              <i class="ti ti-pencil" aria-hidden="true"></i>Rediger
            </button>
            <button type="button" class="btn-action">Del på Facebook</button>
            <button type="button" class="btn-action">Kopiér link</button>
            <button type="button" class="btn-action">Se event</button>
          </div>
        </div>
      </section>

      <div class="events-grid">
        <article
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card"
          :class="{ active: event.id === selectedEventId }"
          @click="selectEvent(event.id)"
        >
          <img class="event-card-image" :src="event.image" :alt="event.title" />
          <div class="event-card-body">
            <div class="event-card-head">
              <h2 class="row-title">{{ event.title }}</h2>
              <span class="pill pill--soft">{{ event.spots }}</span>
            </div>
            <p class="row-copy">{{ event.summary }}</p>
            <div class="event-card-meta">
              <span>{{ event.dateText }}</span>
              <span>{{ event.location }}</span>
              <span>{{ eventTypeLabel(event.type) }}</span>
            </div>
            <button v-if="isAdmin" type="button" class="btn-action event-card-edit" @click.stop="editEvent(event)">
              <i class="ti ti-pencil" aria-hidden="true"></i>Rediger
            </button>
          </div>
        </article>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import PageCard from '@/components/PageCard.vue';
import { useAdminAuth } from '@/features/admin/useAdminAuth';
import { useEventsPage } from '@/features/events/useEventsPage';
import type { EventItem } from '@/features/events/events.types';

const { activeFilter, counts, eventFilterOptions, featuredEvent, filteredEvents, selectEvent, selectedEventId, selectFilter } =
  useEventsPage();
const { isAdmin } = useAdminAuth();
const router = useRouter();

function eventTypeLabel(type: 'event' | 'task' | 'shift') {
  return type === 'event' ? 'Event' : type === 'task' ? 'Opgave' : 'Vagt';
}

// Route an event into the matching admin form, opened in edit mode via ?edit.
const ADMIN_ROUTE: Record<EventItem['type'], string> = {
  shift: '/vagter',
  task: '/opgaver',
  event: '/admin/arrangementer',
};

function editEvent(event: EventItem | null) {
  if (!event) return;
  router.push({ path: ADMIN_ROUTE[event.type], query: { edit: event.id } });
}
</script>

<style scoped>
.event-card-edit {
  margin-top: 12px;
}
</style>
