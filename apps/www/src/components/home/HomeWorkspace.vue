<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="hero-overlay" aria-hidden="true" />
      <div class="hero-content">
        <div class="hero-brand">
          <img class="hero-logo" src="/havets-helte-logo.svg" alt="Havets Helte logo" />
        </div>
        <h1 class="hero-title">{{ homeHero.title }}</h1>
        <div class="hero-desc">{{ homeHero.description }}</div>
      </div>
    </section>

    <div class="page-shell home-shell">
      <div class="content home-content">
        <div class="events-grid home-events-grid">
          <RouterLink
            v-for="item in homeFeedItems"
            :key="item.id"
            class="event-card home-event-card"
            :to="feedHref(item)"
          >
            <img class="event-card-image" :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
            <div class="event-card-body">
              <span class="home-category-badge" :class="{ 'home-category-badge--signup': item.type === 'event' }">
                {{ item.type === 'event' ? 'Tilmelding for spejderne' : item.parentTypes?.length === 2 ? 'Forældrehelte-vagt og opgave' : item.type === 'shift' ? 'Forældrehelte-vagt' : 'Forældrehelte-opgave' }}
              </span>
              <div class="event-card-head">
                <h2 class="row-title">{{ item.title }}</h2>
                <span class="pill pill--soft">{{ item.spots }}</span>
              </div>
              <p class="row-copy">{{ item.summary }}</p>
              <div class="event-card-meta">
                <span>{{ item.dateText }}</span>
                <span>{{ item.location }}</span>
                <span>{{ item.parentTypes?.length === 2 ? 'Vagt og opgave' : typeLabel(item.type) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { useHomePage } from '@/features/home/useHomePage';

const { homeFeedItems, homeHero, feedHref, typeLabel } = useHomePage();
</script>

<style scoped>
.home-events-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
  justify-content: center;
}

.home-category-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--navy-soft);
  color: var(--navy);
  font-size: 0.78rem;
  font-weight: 700;
}

.home-category-badge--signup {
  background: var(--teal-deep);
  color: var(--surface);
}

.home-event-card {
  width: 100%;
  min-width: min(100%, 350px);
  align-content: start;
}

.home-event-card .event-card-body {
  align-content: start;
  justify-items: start;
  text-align: left;
}

.home-event-card .event-card-head {
  width: 100%;
  align-items: flex-start;
}

</style>
