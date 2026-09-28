<template>
  <div class="admin-auth-gate">
    <PageCard v-if="!ready">
      <template #header>
        <div>
          <p class="eyebrow">Admin</p>
          <h1 class="page-title">Lederportal</h1>
        </div>
      </template>
      <p class="lead">Henter login…</p>
    </PageCard>

    <PageCard v-else-if="!user">
      <template #header>
        <div>
          <p class="eyebrow">Admin</p>
          <h1 class="page-title">Lederportal</h1>
        </div>
      </template>

      <div class="admin-login">
        <button
          type="button"
          class="btn-action btn-action--primary"
          :disabled="busy"
          @click="handleGoogleLogin"
        >
          <i class="ti ti-brand-google" aria-hidden="true"></i>
          Log ind med Google
        </button>

        <p v-if="error" class="admin-error">{{ error }}</p>

        <details class="admin-login-fallback">
          <summary>Log ind med mail og adgangskode</summary>
          <form class="admin-login" @submit.prevent="handleLogin">
            <label class="field">
              <span class="field-label">Mail</span>
              <input v-model="email" class="field-input" type="email" autocomplete="email" placeholder="sthinggaard@havetshelte.dk" />
            </label>
            <label class="field">
              <span class="field-label">Adgangskode</span>
              <input v-model="password" class="field-input" type="password" autocomplete="current-password" placeholder="••••••••" />
            </label>

            <div class="admin-login-actions">
              <button type="submit" class="btn-action btn-action--primary" :disabled="busy">
                {{ busy ? 'Logger ind…' : 'Log ind' }}
              </button>
            </div>
          </form>
        </details>
      </div>
    </PageCard>

    <PageCard v-else-if="!isAdmin">
      <template #header>
        <div>
          <p class="eyebrow">Admin</p>
          <h1 class="page-title">Ingen adgang</h1>
        </div>
      </template>
      <p class="lead">
        Din konto ({{ user.email }}) har ikke lederadgang. Log ind med en
        havetshelte.dk-mail for at administrere indhold.
      </p>
      <div class="admin-login-actions">
        <button type="button" class="btn-action" @click="handleLogout">Log ud</button>
      </div>
    </PageCard>

    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import PageCard from '@/components/PageCard.vue';
import { useAdminAuth } from '@/features/admin/useAdminAuth';

const { busy, email, error, isAdmin, login, loginWithGoogle, logout, password, ready, user } = useAdminAuth();
const router = useRouter();

async function handleLogin() {
  await login();
}

async function handleGoogleLogin() {
  await loginWithGoogle();
}

async function handleLogout() {
  await logout();
  await router.replace('/');
}
</script>

<style scoped>
.admin-auth-gate {
  display: grid;
  gap: 16px;
}

.admin-login {
  display: grid;
  gap: 14px;
  max-width: 420px;
}

.admin-login-fallback {
  color: var(--muted);
  font-size: 0.9rem;
}

.admin-login-fallback summary {
  cursor: pointer;
  font-weight: 600;
}

.admin-login-fallback .admin-login {
  margin-top: 14px;
}

.admin-error {
  margin: 0;
  color: #c94853;
  font-size: 0.92rem;
  font-weight: 600;
}

.admin-login-actions {
  display: flex;
  justify-content: flex-start;
}

.admin-userbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.admin-user {
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 700;
}
</style>
