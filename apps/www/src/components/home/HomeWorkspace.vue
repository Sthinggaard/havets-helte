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

      <div class="shell-top">
        <div class="auth-bar" aria-label="Bruger">
          <div class="user-chip">
            <div class="uava">L</div>
            <span>sthinggaard@havetshelte.dk</span>
            <button class="logout" type="button">Log ud</button>
          </div>
        </div>
      </div>

      <div class="content home-content">
        <div class="type-bar" role="group" aria-label="Type">
          <button
            v-for="tab in homeTabs"
            :key="tab.id"
            class="type-btn"
            :class="{ active: activeTab === tab.id }"
            :aria-pressed="activeTab === tab.id"
            type="button"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-if="activeTab !== 'mine'" class="home-feed">
          <section v-if="featuredFeed" class="featured-event">
            <img class="featured-event-image" :src="featuredFeed.image" :alt="featuredFeed.title" />
            <div class="featured-event-body">
              <div class="featured-event-head">
                <div>
                  <p class="card-kicker">Fremhævet</p>
                  <h2 class="featured-event-title">{{ featuredFeed.title }}</h2>
                </div>
                <span class="pill">{{ featuredFeed.spots }}</span>
              </div>

              <p class="lead featured-event-copy">{{ featuredFeed.summary }}</p>

              <div class="info-strip">
                <span class="info-chip">{{ featuredFeed.dateText }}</span>
                <span class="info-chip">{{ featuredFeed.location }}</span>
                <span class="info-chip">{{ typeLabel(featuredFeed.type) }}</span>
              </div>

              <div class="detail-actions">
                <button type="button" class="btn-action btn-action--primary" @click="openFacebookShare(featuredFeed.id)">
                  <i class="ti ti-brand-facebook" aria-hidden="true" />
                  Del på Facebook
                </button>
                <button type="button" class="btn-action" @click="copyLink(featuredFeed.id)">
                  <i class="ti ti-link" aria-hidden="true" />
                  Kopiér link
                </button>
                <RouterLink class="btn-action" :to="feedHref(featuredFeed.id)">
                  {{ featuredFeed.ctaLabel }}
                </RouterLink>
              </div>
            </div>
          </section>

          <div class="events-grid">
            <RouterLink
              v-for="item in visibleFeed"
              :key="item.id"
              class="event-card"
              :class="{ active: item.id === selectedFeedId }"
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

        <div v-else class="home-mine">
          <div class="type-bar type-bar--mine" role="group" aria-label="Tilmeldinger">
            <button
              v-for="tab in homeMineTabs"
              :key="tab.id"
              class="type-btn"
              :class="{ active: mineFilter === tab.id }"
              :aria-pressed="mineFilter === tab.id"
              type="button"
              @click="setMineFilter(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="mine-card">
            <h3><i class="ti ti-circle-check" aria-hidden="true" />Mine tilmeldinger</h3>
            <div v-for="signup in visibleMine" :key="signup.id" class="mine-item">
              <div class="mi-info">
                <div class="mi-title">
                  {{ signup.title }}
                </div>
                <div class="mi-sub">{{ signup.subtitle }}</div>
              </div>
              <button class="mine-cancel" type="button">{{ signup.actionLabel }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { useHomePage } from '@/features/home/useHomePage';

const {
  activeTab,
  homeHero,
  homeMineTabs,
  homeTabs,
  mineFilter,
  openFacebookShare,
  copyLink,
  feedHref,
  selectedFeedId,
  setActiveTab,
  setMineFilter,
  typeLabel,
  visibleFeed,
  visibleMine,
  featuredFeed,
} = useHomePage();
</script>
