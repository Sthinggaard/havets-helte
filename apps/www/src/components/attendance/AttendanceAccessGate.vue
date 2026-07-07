<template>
  <div class="attendance-access-gate">
    <PageCard v-if="!ready">
      <template #header>
        <div>
          <p class="eyebrow">Fremmøde</p>
          <h1 class="page-title">Klargør check-in</h1>
        </div>
      </template>
      <p class="lead">Henter adgang…</p>
    </PageCard>

    <PageCard v-else-if="unlocked">
      <template #header>
        <div class="kiosk-head">
          <div>
            <p class="eyebrow">Fremmøde</p>
            <h1 class="page-title">Check-in er aktiv på denne enhed</h1>
          </div>
          <div class="kiosk-actions">
            <RouterLink class="btn-action" to="/admin/fremmoede">Til admin</RouterLink>
          </div>
        </div>
      </template>
      <p class="lead">Denne side kører nu som selvstændig check-in uden admin-menu. Går du tilbage til admin, skal du logge ind igen.</p>
    </PageCard>

    <PageCard v-else-if="!user">
      <template #header>
        <div>
          <p class="eyebrow">Fremmøde</p>
          <h1 class="page-title">Åbn check-in på denne enhed</h1>
        </div>
      </template>

      <form class="attendance-login" @submit.prevent="handleLogin">
        <label class="field">
          <span class="field-label">Mail</span>
          <input v-model="email" class="field-input" type="email" autocomplete="email" placeholder="sthinggaard@havetshelte.dk" />
        </label>
        <label class="field">
          <span class="field-label">Adgangskode</span>
          <input v-model="password" class="field-input" type="password" autocomplete="current-password" placeholder="••••••••" />
        </label>

        <p v-if="error" class="attendance-error">{{ error }}</p>

        <div class="attendance-login-actions">
          <button type="submit" class="btn-action btn-action--primary" :disabled="busy">
            {{ busy ? 'Logger ind…' : 'Log ind som leder' }}
          </button>
        </div>
      </form>
    </PageCard>

    <PageCard v-else-if="!isAdmin">
      <template #header>
        <div>
          <p class="eyebrow">Fremmøde</p>
          <h1 class="page-title">Ingen adgang</h1>
        </div>
      </template>
      <p class="lead">
        Kun en lederkonto kan åbne check-in på denne enhed.
      </p>
      <div class="attendance-login-actions">
        <button type="button" class="btn-action" @click="logout">Log ud</button>
      </div>
    </PageCard>

    <PageCard v-else>
      <template #header>
        <div>
          <p class="eyebrow">Fremmøde</p>
          <h1 class="page-title">Aktivér check-in</h1>
        </div>
      </template>
      <p class="lead">Åbn fremmøde på denne enhed og log bagefter lederen ud, så børnene kun ser check-in.</p>
      <div class="attendance-login-actions">
        <button type="button" class="btn-action btn-action--primary" @click="unlockAttendance">
          Åbn fremmøde på denne enhed
        </button>
        <button type="button" class="btn-action" @click="logout">Log ud</button>
      </div>
    </PageCard>

    <template v-if="unlocked">
      <div class="attendance-kiosk-bar">
        <span class="attendance-kiosk-chip">Check-in</span>
        <div class="kiosk-actions">
          <RouterLink class="btn-action" to="/admin/fremmoede">Til admin</RouterLink>
        </div>
      </div>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import PageCard from '@/components/PageCard.vue';
import { useAdminAuth } from '@/features/admin/useAdminAuth';

const ATTENDANCE_UNLOCK_KEY = 'sankthans.attendanceUnlocked';

const { busy, email, error, isAdmin, login, logout, password, ready, user } = useAdminAuth();
const unlocked = ref(false);

function readUnlockedState() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(ATTENDANCE_UNLOCK_KEY) === 'true';
}

function writeUnlockedState(value: boolean) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.sessionStorage.setItem(ATTENDANCE_UNLOCK_KEY, 'true');
  } else {
    window.sessionStorage.removeItem(ATTENDANCE_UNLOCK_KEY);
  }
}

async function handleLogin() {
  await login();
}

async function unlockAttendance() {
  writeUnlockedState(true);
  unlocked.value = true;
  await logout();
}

function lockAttendance() {
  writeUnlockedState(false);
  unlocked.value = false;
}

onMounted(() => {
  unlocked.value = readUnlockedState();
});
</script>

<style scoped>
.attendance-access-gate {
  display: grid;
  gap: 16px;
}

.attendance-login {
  display: grid;
  gap: 14px;
  max-width: 420px;
}

.attendance-error {
  margin: 0;
  color: #c94853;
  font-size: 0.92rem;
  font-weight: 600;
}

.attendance-login-actions,
.kiosk-head,
.attendance-kiosk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.attendance-kiosk-bar,
.kiosk-head {
  justify-content: space-between;
}

.kiosk-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.attendance-kiosk-bar {
  padding: 0 4px;
}

.attendance-kiosk-chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--row-bg);
  color: var(--navy);
  font-size: 0.76rem;
  font-weight: 800;
}
</style>
