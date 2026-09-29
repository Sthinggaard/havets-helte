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
        <div class="filter-tabs home-filter-tabs" role="tablist" aria-label="Vælg opslagstype">
          <button
            v-for="tab in homeTabs"
            :key="tab.id"
            type="button"
            class="filter-tab"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
            <span class="filter-tab-count">{{ counts[tab.id] }}</span>
          </button>
        </div>

        <div class="events-grid home-events-grid">
          <RouterLink
            v-for="item in homeFeedItems"
            :key="item.id"
            class="event-card home-event-card"
            :to="feedHref(item)"
          >
            <img class="event-card-image" :src="item.image" :alt="item.title" loading="lazy" decoding="async" />
            <div class="event-card-body">
              <span class="home-category-badge">
                {{ item.type === 'event' ? 'Tilmelding for spejderne' : item.type === 'shift' ? 'Forældrehelte-vagt' : 'Forældrehelte-opgave' }}
              </span>
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

const { activeTab, counts, homeFeedItems, homeHero, homeTabs, feedHref, selectTab, typeLabel } = useHomePage();
</script>

<style scoped>
.home-events-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
  justify-content: center;
}

.home-filter-tabs {
  margin: 0 0 20px;
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
