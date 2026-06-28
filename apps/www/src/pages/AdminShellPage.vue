<template>
  <AdminAuthGate>
    <div class="page-stack">
      <PageCard>
        <template #header>
          <div>
            <p class="eyebrow">Admin</p>
            <h1 class="page-title">Administrer indhold</h1>
          </div>
        </template>

        <div class="admin-hub-grid">
          <router-link v-for="item in adminItems" :key="item.path" class="admin-hub-card" :to="item.path">
            <span class="admin-hub-icon"><i :class="item.icon" aria-hidden="true"></i></span>
            <span>
              <span class="admin-hub-title">{{ item.title }}</span>
              <span class="admin-hub-meta">{{ item.meta }}</span>
            </span>
          </router-link>
        </div>
      </PageCard>
    </div>
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import PageCard from '@/components/PageCard.vue';

const adminItems = [
  { path: '/admin/vagter', icon: 'ti ti-clock', title: 'Vagter', meta: 'Åbn liste og rediger' },
  { path: '/admin/opgaver', icon: 'ti ti-list-check', title: 'Opgaver', meta: 'Åbn liste og rediger' },
  { path: '/admin/arrangementer', icon: 'ti ti-calendar', title: 'Arrangementer', meta: 'Åbn liste og rediger' },
  { path: '/admin/billedbibliotek', icon: 'ti ti-photo', title: 'Billedbibliotek', meta: 'Upload og vælg billeder' },
] as const;
</script>

<style scoped>
.admin-hub-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.admin-hub-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  text-decoration: none;
  box-shadow: none;
}

.admin-hub-card:hover,
.admin-hub-card:focus-visible {
  border-color: var(--navy-light);
}

.admin-hub-card:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

.admin-hub-icon {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 9px;
  background: var(--gold-light);
  color: var(--navy);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.admin-hub-title,
.admin-hub-meta {
  display: block;
}

.admin-hub-title {
  color: var(--navy);
  font-weight: 800;
}

.admin-hub-meta {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.88rem;
}
</style>
