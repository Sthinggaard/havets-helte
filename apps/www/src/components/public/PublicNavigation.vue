<template>
  <header class="public-navigation">
    <div class="public-navigation__inner">
      <RouterLink class="public-navigation__brand" to="/" aria-label="Havets Helte – forside">
        <i class="ti ti-anchor" aria-hidden="true"></i>
        <span>Havets Helte</span>
      </RouterLink>

      <nav class="public-navigation__links" aria-label="Hovedmenu">
        <RouterLink
          v-for="item in publicNavigationItems"
          :key="item.path"
          class="public-navigation__link"
          :to="item.path"
          exact-active-class="public-navigation__link--active"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { publicNavigationItems } from '@/content/navigation';
</script>

<style scoped>
.public-navigation {
  position: relative;
  z-index: 20;
  background: var(--navy);
  border-bottom: 1px solid var(--navy-light);
}

.public-navigation__inner {
  width: min(1120px, calc(100% - 32px));
  min-height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.public-navigation__brand,
.public-navigation__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: var(--teal-light);
  font-weight: 800;
}

.public-navigation__brand {
  gap: 8px;
  color: var(--surface);
  white-space: nowrap;
}

.public-navigation__brand i {
  color: var(--teal-light);
  font-size: 1.2rem;
}

.public-navigation__links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: wrap;
}

.public-navigation__link {
  padding: 8px 11px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.public-navigation__link:hover {
  color: var(--surface);
}

.public-navigation__link--active {
  background: var(--teal-deep);
  color: var(--surface);
}

@media (max-width: 700px) {
  .public-navigation__inner {
    width: min(100%, calc(100% - 28px));
    padding: 8px 0;
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .public-navigation__links {
    width: 100%;
    justify-content: flex-start;
  }

  .public-navigation__link {
    flex: 1 1 auto;
  }
}
</style>
