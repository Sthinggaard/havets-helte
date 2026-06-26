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
  { path: '/vagter?new', icon: 'ti ti-clock-plus', title: 'Ny vagt', meta: 'Tidsrum og pladser' },
  { path: '/opgaver?new', icon: 'ti ti-list-check', title: 'Ny opgave', meta: 'Praktiske opgaver' },
  { path: '/admin/arrangementer?new', icon: 'ti ti-calendar-plus', title: 'Nyt arrangement', meta: 'Tilmelding og betaling' },
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
  border-radius: 12px;
  background: #fff;
  color: var(--text);
  text-decoration: none;
  box-shadow: 0 8px 18px rgba(8, 36, 65, 0.05);
}

.admin-hub-card:hover,
.admin-hub-card:focus-visible {
  border-color: var(--navy);
  outline: none;
}

.admin-hub-icon {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: #ecf4fb;
  color: var(--navy);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.admin-hub-title,
.admin-hub-meta {
  display: block;
}

.admin-hub-title {
  color: var(--navy-dark);
  font-weight: 800;
}

.admin-hub-meta {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.88rem;
}
</style>
