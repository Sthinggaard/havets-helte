<template>
  <AdminPageTemplate title="Mine tilmeldinger" copy="Se og administrer dine tilmeldinger til foreningens aktiviteter.">
    <div class="page-stack">
    <PageCard>
      <template #header>
        <div>
          <p class="eyebrow">Lederportal</p>
          <h1 class="page-title">Mine tilmeldinger</h1>
        </div>
      </template>

      <p v-if="loading" class="status" aria-live="polite">Henter dine tilmeldinger…</p>
      <p v-else-if="error" class="error" role="alert">{{ error }}</p>
      <div v-else-if="signups.length === 0" class="empty-state">
        <strong>Ingen tilmeldinger endnu</strong>
        <span>Find en opgave under Arrangementer.</span>
      </div>
      <ul v-else class="signup-list">
        <li v-for="signup in signups" :key="signup.id" class="signup-item">
          <button type="button" class="signup-item__details" @click="openEvent(signup)">
            <strong>{{ signup.eventTitle }}</strong>
            <span>{{ signup.dateText }}<template v-if="signup.location"> · {{ signup.location }}</template></span>
            <span>{{ signup.slotLabel }}<template v-if="signup.groupSize > 1"> · {{ signup.groupSize }} deltagere</template><template v-if="signup.audienceGroupLabel"> · {{ signup.audienceGroupLabel }}</template></span>
            <span v-if="signup.waitlist" class="signup-item__status">Venteliste</span>
            <span v-else-if="signup.isLeader" class="signup-item__status">Leder</span>
            <span class="signup-item__link">Se arrangementet →</span>
          </button>
        </li>
      </ul>
    </PageCard>
    </div>
  </AdminPageTemplate>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import PageCard from '@/components/PageCard.vue';
import AdminPageTemplate from '@/components/admin/AdminPageTemplate.vue';
import { loadLeaderSignups, type LeaderSignup } from '@/features/leaderSignups/leaderSignups.data';

const router = useRouter();
const loading = ref(true);
const error = ref('');
const signups = ref<LeaderSignup[]>([]);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await loadLeaderSignups();
    signups.value = response.signups;
  } catch (err) {
    console.error('[leader-signups] loading failed', err);
    error.value = 'Dine tilmeldinger kunne ikke hentes. Prøv igen.';
  } finally {
    loading.value = false;
  }
}

function openEvent(signup: LeaderSignup) {
  const path = signup.eventType === 'timed' ? '/vagter' : signup.eventType === 'task' ? '/opgaver' : '/events';
  router.push({ path, query: { event: signup.eventId } });
}

onMounted(load);
</script>

<style scoped>
.status { color: var(--muted); }
.error { color: var(--danger); font-weight: 700; }
.empty-state { display: grid; gap: 4px; padding: 14px; border-left: 4px solid var(--teal); background: var(--navy-soft); }
.signup-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.signup-item { padding: 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--row-bg); }
.signup-item__details { display: grid; gap: 4px; width: 100%; border: 0; padding: 0; background: transparent; color: inherit; text-align: left; font: inherit; cursor: pointer; }
.signup-item__details:focus-visible { outline: 3px solid var(--teal); outline-offset: 4px; border-radius: 4px; }
.signup-item span { color: var(--muted); font-size: .92rem; }
.signup-item__status { color: var(--navy) !important; font-weight: 700; }
.signup-item__link { margin-top: 4px; color: var(--navy) !important; font-weight: 700; }
</style>
