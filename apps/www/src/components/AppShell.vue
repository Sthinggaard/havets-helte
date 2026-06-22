<template>
  <div class="app-frame">
    <header class="topbar">
      <router-link class="brand" to="/">
        <span class="brand-mark">⚓</span>
        <span class="brand-text">Forældrehelte</span>
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

      <div class="auth-chip">leder@test.dk</div>
    </header>

    <main class="page-shell">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { navigationItems } from '@/content/navigation';
</script>

