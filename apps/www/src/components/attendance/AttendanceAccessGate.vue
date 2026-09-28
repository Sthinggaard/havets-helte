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

    <PageCard v-else-if="!user && !unlocked">
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

    <PageCard v-else-if="!isAdmin && !unlocked">
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

    <PageCard v-else-if="!unlocked">
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
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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

.attendance-access-gate > .page-card {
  width: min(1180px, calc(100% - 40px));
  margin: 24px auto;
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

.attendance-login-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 560px) {
  .attendance-access-gate {
    gap: 12px;
  }

  .attendance-access-gate > .page-card {
    width: min(100%, calc(100% - 24px));
    margin-block: 12px;
  }
}
</style>
