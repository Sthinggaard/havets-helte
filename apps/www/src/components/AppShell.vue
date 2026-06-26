<template>
  <div class="app-frame" :class="{ 'app-frame--landing': isLanding }">
    <template v-if="!isLanding">
      <header class="topbar">
        <router-link class="brand" to="/">
          <span class="brand-mark"><i class="ti ti-anchor" aria-hidden="true"></i></span>
          <span class="brand-text">Havets Helte</span>
        </router-link>

        <nav class="nav" aria-label="Sektioner">
          <router-link
            v-for="item in navigationItems"
            :key="item.path"
            class="nav-link"
            :to="item.path"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="auth-chip">Lederportal</div>
      </header>

      <main class="page-shell">
        <slot />
      </main>
    </template>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useRoute } from 'vue-router';

import { navigationItems } from '@/content/navigation';

const route = useRoute();
const isLanding = computed(() => route.meta.shell === 'landing');
</script>
