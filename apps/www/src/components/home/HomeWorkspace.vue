<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="hero-overlay" aria-hidden="true" />
      <div class="hero-waves" aria-hidden="true">
        <svg viewBox="0 0 249 60">
          <defs>
            <path
              id="homeWaveLine"
              class="home-wave"
              d="M4.5,15.5c12,0,12-11,24-11s12,11,24,11,12-11,24-11,12,11,24,11,12-11,24-11,12,11,24,11,12-11,24-11,12,11,24,11,12-11,24-11,12,11,24,11,12-11,24-11,12,11,24,11,12-11,24-11"
            />
          </defs>
          <use href="#homeWaveLine" y="0" />
          <use href="#homeWaveLine" y="30" />
          <use href="#homeWaveLine" y="60" />
        </svg>
      </div>
    </section>

    <div class="page-shell home-shell">
      <div class="hero-content">
        <div class="hero-brand">
          <img class="hero-logo" src="/havets-helte-logo.svg" alt="Havets Helte logo" />
          <div class="hero-badge">
            <i class="ti ti-anchor" aria-hidden="true" />
            {{ homeHero.badge }}
          </div>
        </div>
        <h1 class="hero-title">{{ homeHero.title }}</h1>
        <div class="hero-desc">{{ homeHero.description }}</div>
        <RouterLink class="home-volunteer-link" to="/frivillighelte">
          <i class="ti ti-heart-handshake" aria-hidden="true" />
          Se Frivillighelte
        </RouterLink>
      </div>

        <div class="content home-content">
          <div class="section-head section-head--compact">
            <div>
              <h2 class="section-title">Arrangementer, opgaver og vagter</h2>
            </div>
          </div>

        <div class="events-grid home-events-grid">
          <RouterLink
            v-for="item in homeFeedItems"
            :key="item.id"
            class="event-card home-event-card"
            :to="feedHref(item.id)"
          >
            <img class="event-card-image" :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
            <div class="event-card-body">
              <div class="event-card-head">
                <h2 class="row-title">{{ item.title }}</h2>
                <span class="pill pill--soft">{{ item.spots }}</span>
              </div>
              <p class="row-copy">{{ item.summary }}</p>
              <div class="event-card-meta">
                <span>{{ item.dateText }}</span>
                <span>{{ item.location }}</span>
                <span>{{ typeLabel(item.type) }}</span>
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

.home-volunteer-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-height: 44px;
  margin-top: 16px;
  padding: 10px 14px;
  border: 1px solid rgba(44, 152, 183, 0.52);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 800;
}

.home-volunteer-link:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
