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

      <form class="admin-login" @submit.prevent="handleLogin">
        <label class="field">
          <span class="field-label">Mail</span>
          <input v-model="email" class="field-input" type="email" autocomplete="email" placeholder="sthinggaard@havetshelte.dk" />
        </label>
        <label class="field">
          <span class="field-label">Adgangskode</span>
          <input v-model="password" class="field-input" type="password" autocomplete="current-password" placeholder="••••••••" />
        </label>

        <p v-if="error" class="admin-error">{{ error }}</p>

        <div class="admin-login-actions">
          <button type="submit" class="btn-action btn-action--primary" :disabled="busy">
            {{ busy ? 'Logger ind…' : 'Log ind' }}
          </button>
        </div>
      </form>
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
        <button type="button" class="btn-action" @click="logout">Log ud</button>
      </div>
    </PageCard>

    <template v-else>
      <div class="admin-userbar">
        <span class="admin-user">{{ user.email }}</span>
        <button type="button" class="btn-action" @click="logout">Log ud</button>
      </div>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { useAdminAuth } from '@/features/admin/useAdminAuth';

const { busy, email, error, isAdmin, login, logout, password, ready, user } = useAdminAuth();

async function handleLogin() {
  await login();
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
