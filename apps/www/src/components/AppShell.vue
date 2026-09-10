<template>
  <div class="app-frame" :class="{ 'app-frame--landing': isLanding }">
    <div v-if="isAdmin && !isAttendance" class="mode-switch-wrap" :class="{ 'mode-switch-wrap--landing': isLanding }">
      <nav class="mode-switch" aria-label="Visning">
        <router-link class="mode-switch-link" to="/" :class="{ active: isLanding }">
          Landing
        </router-link>
        <router-link class="mode-switch-link" to="/admin" :class="{ active: isAdminRoute }">
          Admin
        </router-link>
      </nav>
    </div>

    <template v-if="!isLanding && !isAttendance">
      <header class="topbar">
        <router-link class="brand" to="/">
          <span class="brand-mark"><i class="ti ti-anchor" aria-hidden="true"></i></span>
          <span class="brand-text">Havets Helte</span>
        </router-link>

        <nav class="nav" aria-label="Sektioner">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            class="nav-link"
            :to="item.path"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="topbar-meta">
          <div class="auth-chip">Lederportal</div>
        </div>
      </header>

      <main class="page-shell">
        <slot />
      </main>
    </template>

    <template v-else>
      <PublicNavigation v-if="isLanding" />
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useRoute } from 'vue-router';

import { adminNavigationItems, navigationItems } from '@/content/navigation';
import { useAdminAuth } from '@/features/admin/useAdminAuth';

import PublicNavigation from './public/PublicNavigation.vue';

const route = useRoute();
const { isAdmin } = useAdminAuth();
const isLanding = computed(() => route.meta.shell === 'landing');
const isAttendance = computed(() => route.meta.shell === 'attendance');
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const navItems = computed(() => {
  if (isAdminRoute.value) return adminNavigationItems;
  return isAdmin.value ? navigationItems : navigationItems.filter(item => item.path !== '/admin');
});
</script>
