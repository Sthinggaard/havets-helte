<template>
  <header
    v-if="!isAttendance"
    class="app-navigation"
    :class="[
      isLanding ? 'app-navigation--landing' : 'app-navigation--admin',
    ]"
  >
    <div class="app-navigation__inner">
      <RouterLink class="app-navigation__brand" to="/" aria-label="Havets Helte – forside">
        <i class="ti ti-anchor" aria-hidden="true"></i>
        <span>Havets Helte</span>
      </RouterLink>

      <button
        type="button"
        class="app-navigation__toggle"
        :aria-expanded="menuOpen"
        aria-controls="app-navigation-links"
        :aria-label="menuOpen ? 'Luk menu' : 'Åbn menu'"
        @click="menuOpen = !menuOpen"
      >
        <i class="ti" :class="menuOpen ? 'ti-x' : 'ti-menu-2'" aria-hidden="true"></i>
        <span>Menu</span>
      </button>

      <nav
        id="app-navigation-links"
        class="app-navigation__links nav"
        :class="{ 'app-navigation__links--open': menuOpen, 'app-navigation__links--admin': !isLanding }"
        aria-label="Hovedmenu"
        @keydown.esc="menuOpen = false"
      >
        <RouterLink
          v-for="item in visibleNavigationItems"
          :key="item.path"
          class="app-navigation__link"
          :to="item.path"
          exact-active-class="app-navigation__link--active"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink v-if="!isAdmin" class="app-navigation__link app-navigation__link--login-mobile" to="/admin" @click="menuOpen = false">
          Leder-login
        </RouterLink>
        <button v-if="isAdmin && user" type="button" class="app-navigation__mobile-logout" @click="handleLogout">
          Log ud
        </button>
      </nav>

      <RouterLink v-if="!isAdmin" class="app-navigation__leader-login" to="/admin">Leder-login</RouterLink>

      <div v-if="isAdmin && user" class="nav-account">
        <span class="nav-account__email">{{ user.email }}</span>
        <button type="button" class="nav-account__logout" @click="handleLogout">Log ud</button>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  adminNavigationItems,
  publicNavigationItems,
} from '@/content/navigation';
import { useAdminAuth } from '@/features/admin/useAdminAuth';

const route = useRoute();
const router = useRouter();
const { isAdmin, logout, user } = useAdminAuth();
const menuOpen = ref(false);
const isLanding = computed(() => route.meta.shell === 'landing');
const isAttendance = computed(() => route.meta.shell === 'attendance');
const visibleNavigationItems = computed(() => {
  if (!isAdmin.value) return publicNavigationItems.filter(item => item.path !== '/admin');

  // Admins use the leader view for their own signups; omit the public alias
  // so “Mine tilmeldinger” only appears once in the unified menu.
  const publicItems = publicNavigationItems.filter(item => item.path !== '/admin' && item.path !== '/mine');
  return [...publicItems, ...adminNavigationItems];
});

async function handleLogout() {
  try {
    await logout();
    menuOpen.value = false;
    if (route.path !== '/') await router.replace('/');
  } catch (error) {
    console.error('[navigation] logout failed', error);
  }
}
</script>

<style scoped>
.app-navigation {
  position: sticky;
  top: 0;
  z-index: 30;
}

.app-navigation--landing {
  background: var(--navy);
  border-bottom: 1px solid var(--navy-light);
}

.app-navigation__inner {
  position: relative;
  width: min(1720px, calc(100% - 32px));
  min-height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-navigation__brand,
.app-navigation__link,
.app-navigation__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: var(--teal-light);
  font-weight: 800;
}

.app-navigation__brand {
  gap: 8px;
  color: var(--surface);
  white-space: nowrap;
}

.app-navigation__brand i {
  color: var(--teal-light);
  font-size: 1.2rem;
}

.app-navigation__links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.nav-account {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  white-space: nowrap;
}

.nav-account__email {
  color: var(--teal-light);
  font-size: 0.8rem;
  font-weight: 700;
}

.nav-account__logout {
  position: relative;
  z-index: 1;
  min-height: 40px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--navy);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.app-navigation__mobile-logout {
  display: none;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  background: transparent;
  color: var(--surface);
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  text-align: left;
}

.app-navigation__link {
  padding: 8px 8px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.app-navigation__link:hover,
.app-navigation__link--active {
  color: var(--surface);
}

.app-navigation__link--active {
  background: var(--teal-deep);
}

.app-navigation__leader-login {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding-inline: 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--navy);
  font-weight: 800;
  white-space: nowrap;
}

.app-navigation__leader-login:hover {
  background: var(--surface);
  color: var(--navy);
}

.app-navigation__link--login-mobile {
  display: none;
}

.app-navigation__toggle {
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

.app-navigation--admin {
  padding: 0;
  border-bottom: 1px solid var(--navy-light);
  background: var(--navy);
  color: #fff;
}

.app-navigation--admin .app-navigation__inner {
  width: 100%;
  max-width: 1720px;
  margin: 0 auto;
}

.app-navigation__links--admin {
  flex: none;
}

.app-navigation--dashboard {
  justify-content: flex-end;
}

@media (max-width: 1100px) {
  .app-navigation--admin {
    flex-wrap: wrap;
  }

  .app-navigation--admin .app-navigation__links {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }
}

@media (max-width: 1100px) {
  .app-navigation--admin {
    position: relative;
    min-height: 64px;
    padding: 10px 14px;
    gap: 12px;
  }

  .app-navigation--admin .app-navigation__toggle {
    display: inline-flex;
    margin-left: auto;
  }

  .app-navigation--admin .topbar-meta {
    display: none;
  }

  .nav-account {
    display: inline-flex;
  }

  .nav-account__email {
    display: none;
  }

  .app-navigation--admin > .mode-switch {
    flex-shrink: 0;
  }

  .app-navigation--admin .app-navigation__links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 2;
    display: none;
    width: 100%;
    padding: 8px 14px 14px;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    overflow: visible;
    transform: none;
    background: var(--navy);
    border-bottom: 1px solid var(--navy-light);
    box-shadow: var(--shadow-lift);
  }

  .app-navigation--admin .app-navigation__links--open {
    display: flex;
  }

  .app-navigation--admin .app-navigation__links .app-navigation__link {
    justify-content: flex-start;
    padding: 10px 14px;
  }

  .app-navigation__mobile-logout {
    display: block;
  }

  .nav-account__logout {
    display: none;
  }

  .app-navigation--admin .app-navigation__links,
  .app-navigation:not(.app-navigation--admin) .app-navigation__links {
    left: auto;
    right: 0;
    width: min(320px, calc(100vw - 28px));
    border-left: 1px solid var(--navy-light);
    border-bottom-left-radius: 12px;
  }

  .app-navigation__inner {
    width: min(100%, calc(100% - 28px));
    min-height: 64px;
    padding: 10px 0;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .app-navigation__brand {
    min-width: 0;
    justify-content: flex-start;
  }

  .app-navigation__brand span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-navigation__inner .mode-switch {
    flex-shrink: 1;
  }

  .app-navigation__inner .mode-switch-link {
    min-height: 36px;
    padding-inline: 9px;
  }

  .app-navigation__toggle {
    display: inline-flex;
    margin-left: auto;
  }

  .app-navigation__links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    display: none;
    padding: 8px 14px 14px;
    flex-direction: column;
    flex-wrap: nowrap;
    white-space: normal;
    align-items: stretch;
    gap: 4px;
    background: var(--navy);
    border-bottom: 1px solid var(--navy-light);
    box-shadow: var(--shadow-lift);
    transform: none;
  }

  .app-navigation__links--open {
    display: flex;
  }

  .app-navigation__link {
    justify-content: flex-start;
    padding-inline: 14px;
  }

  .app-navigation__leader-login {
    display: none;
  }

  .app-navigation__link--login-mobile {
    display: inline-flex;
    margin-left: 0;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--navy);
  }
}
</style>
