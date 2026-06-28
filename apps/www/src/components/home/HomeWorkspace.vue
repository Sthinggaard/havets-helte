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
      </div>

      <div class="content home-content">
        <div class="section-head section-head--compact">
          <div>
            <p class="eyebrow">Vælg en side</p>
            <h2 class="section-title">Arrangementer, opgaver og vagter</h2>
          </div>
        </div>

        <div class="events-grid">
          <RouterLink
            v-for="item in homeFeedItems"
            :key="item.id"
            class="event-card"
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
