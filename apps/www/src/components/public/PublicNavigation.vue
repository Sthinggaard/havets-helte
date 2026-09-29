<template>
  <header class="public-navigation">
    <div class="public-navigation__inner">
      <RouterLink class="public-navigation__brand" to="/" aria-label="Havets Helte – forside">
        <i class="ti ti-anchor" aria-hidden="true"></i>
        <span>Havets Helte</span>
      </RouterLink>

      <button
        type="button"
        class="public-navigation__toggle"
        :aria-expanded="menuOpen"
        aria-controls="public-navigation-links"
        :aria-label="menuOpen ? 'Luk menu' : 'Åbn menu'"
        @click="menuOpen = !menuOpen"
      >
        <i class="ti" :class="menuOpen ? 'ti-x' : 'ti-menu-2'" aria-hidden="true"></i>
        <span>Menu</span>
      </button>

      <nav
        id="public-navigation-links"
        class="public-navigation__links"
        :class="{ 'public-navigation__links--open': menuOpen }"
        aria-label="Hovedmenu"
        @keydown.esc="menuOpen = false"
      >
        <RouterLink
          v-for="item in publicNavigationItems"
          :key="item.path"
          class="public-navigation__link"
          :to="item.path"
          :exact-active-class="isHomeCategory(item.path) ? '' : 'public-navigation__link--active'"
          :class="{ 'public-navigation__link--active': isHomeCategory(item.path) && isHomeCategoryActive(item.path) }"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { publicNavigationItems } from '@/content/navigation';

const menuOpen = ref(false);
const route = useRoute();

function isHomeCategory(path: string) {
  return path.startsWith('/?tab=');
}

function isHomeCategoryActive(path: string) {
  if (route.path !== '/') return false;
  const selectedCategory = path.split('tab=')[1];
  const scoutSignupsSelected = route.query.tab === 'scout-signups' || route.query.tab === 'event';
  return selectedCategory === 'scout-signups' ? scoutSignupsSelected : !scoutSignupsSelected;
}
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
.public-navigation__link,
.public-navigation__toggle {
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

.public-navigation__toggle {
  display: none;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--teal-light);
  border-radius: 10px;
  background: transparent;
  color: var(--surface);
  font: inherit;
  cursor: pointer;
}

.public-navigation__toggle i {
  color: var(--teal-light);
  font-size: 1.2rem;
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
    min-height: 64px;
    padding: 10px 0;
    gap: 12px;
  }

  .public-navigation__links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    display: none;
    padding: 8px 14px 14px;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    background: var(--navy);
    border-bottom: 1px solid var(--navy-light);
    box-shadow: var(--shadow-lift);
  }

  .public-navigation__links--open {
    display: flex;
  }

  .public-navigation__link {
    justify-content: flex-start;
    padding-inline: 14px;
  }

  .public-navigation__toggle {
    display: inline-flex;
  }
}
</style>
