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
            <button type="button" class="btn-action btn-action--primary">Del på Facebook</button>
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
          </div>
        </article>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { useEventsPage } from '@/features/events/useEventsPage';

const { activeFilter, counts, eventFilterOptions, featuredEvent, filteredEvents, selectEvent, selectedEventId, selectFilter } =
  useEventsPage();

function eventTypeLabel(type: 'event' | 'task' | 'shift') {
  return type === 'event' ? 'Event' : type === 'task' ? 'Opgave' : 'Vagt';
}
</script>
