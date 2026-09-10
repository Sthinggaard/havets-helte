<template>
  <PublicLandingPageShell
    content-width="640px"
    hero-badge="Frivillige"
    hero-count-label="Top 10"
    hero-title="Frivillighelte"
    hero-copy="Tak til dem, der giver en hånd med, når der er brug for det."
    hero-image="/og-sankthans.png"
    hero-image-alt="Havets Helte"
    section-eyebrow="Frivillighelte"
    section-title="Flest frivilligtilmeldinger"
    section-chip="Top 10"
  >
    <template #hero-actions>
      <RouterLink class="hero-action" to="/">
        <i class="ti ti-arrow-left" aria-hidden="true"></i>
        Tilbage
      </RouterLink>
    </template>

    <template #body>
      <div v-if="loading" class="leaderboard-status" role="status">
        <i class="ti ti-loader spinning" aria-hidden="true"></i>
        Henter frivillighelte…
      </div>

      <div v-else-if="loadError" class="leaderboard-status leaderboard-status--error" role="alert">
        Kunne ikke hente leaderboardet. Prøv igen senere.
      </div>

      <div
        v-else-if="!topEntries.length"
        class="leaderboard-empty"
        role="status"
        aria-label="Leaderboardet er klar. Guld, sølv og bronze er endnu ikke tildelt."
      >
        <div class="leaderboard-empty-medals" aria-hidden="true">
          <span class="leaderboard-rank leaderboard-rank--medal leaderboard-rank--gold"><i class="ti ti-medal"></i></span>
          <span class="leaderboard-rank leaderboard-rank--medal leaderboard-rank--silver"><i class="ti ti-medal"></i></span>
          <span class="leaderboard-rank leaderboard-rank--medal leaderboard-rank--bronze"><i class="ti ti-medal"></i></span>
        </div>
      </div>

      <ol v-else class="leaderboard-list" aria-label="Top 10 frivillighelte">
        <li v-for="(entry, index) in topEntries" :key="entry.name" class="leaderboard-row" :class="{ 'leaderboard-row--first': index === 0 }">
          <span
            v-if="index < 3"
            class="leaderboard-rank leaderboard-rank--medal"
            :class="`leaderboard-rank--${medalTone(index)}`"
            :aria-label="`${medalLabel(index)} · plads ${index + 1}`"
            role="img"
          >
            <i class="ti ti-medal" aria-hidden="true"></i>
          </span>
          <span v-else class="leaderboard-rank">{{ index + 1 }}</span>
          <span class="leaderboard-avatar" aria-hidden="true">{{ initials(entry.name) }}</span>
          <span class="leaderboard-name">{{ entry.name }}</span>
          <span class="leaderboard-count">{{ pointLabel(entry.points) }}</span>
        </li>
      </ol>
      <p v-if="topEntries.length" class="leaderboard-note">
        Pointene afhænger af rollen: koordinator/togholder 5, opsætning/nedtagning 3, almindelig vagt 2 og oprydning/service 1.
      </p>
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { fetchVolunteerLeaderboard, type VolunteerLeaderboardEntry } from '@/features/volunteerLeaderboard/volunteerLeaderboard.data';

import PublicLandingPageShell from './PublicLandingPageShell.vue';

const loading = ref(true);
const loadError = ref(false);
const entries = ref<VolunteerLeaderboardEntry[]>([]);
const topEntries = computed(() => entries.value.slice(0, 10));

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function pointLabel(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'point'}`;
}

function medalTone(index: number): 'gold' | 'silver' | 'bronze' {
  return index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
}

function medalLabel(index: number): string {
  return index === 0 ? 'Guld' : index === 1 ? 'Sølv' : 'Bronze';
}

onMounted(async () => {
  try {
    entries.value = await fetchVolunteerLeaderboard();
  } catch (error) {
    console.error('[volunteer-leaderboard] failed to load', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.leaderboard-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 30px 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 51, 102, 0.1);
  border-radius: 16px;
  background: #f7fafc;
}

.leaderboard-row--first {
  border-color: rgba(20, 110, 136, 0.32);
  background: #edf7f9;
}

.leaderboard-rank {
  color: var(--navy);
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.leaderboard-row--first .leaderboard-rank {
  color: var(--teal-deep);
}

.leaderboard-rank--medal {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--navy-dark);
  font-size: 1.15rem;
}

.leaderboard-row--first .leaderboard-rank--medal {
  color: var(--navy-dark);
}

.leaderboard-rank--gold {
  background: var(--medal-gold);
}

.leaderboard-rank--silver {
  background: var(--medal-silver);
}

.leaderboard-rank--bronze {
  background: var(--medal-bronze);
}

.leaderboard-avatar {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.leaderboard-row--first .leaderboard-avatar {
  background: var(--teal-deep);
}

.leaderboard-name {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leaderboard-count {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.leaderboard-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 160px;
  color: var(--muted);
  font-weight: 700;
  text-align: center;
}

.leaderboard-empty {
  display: grid;
  min-height: 160px;
  place-items: center;
}

.leaderboard-empty-medals {
  display: flex;
  align-items: center;
  gap: 14px;
}

.leaderboard-empty .leaderboard-rank--medal {
  width: 48px;
  height: 48px;
  font-size: 1.65rem;
}

.leaderboard-status--error {
  color: #9d2f3c;
}

.leaderboard-note {
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .leaderboard-row {
    grid-template-columns: 26px 36px minmax(0, 1fr);
    gap: 10px;
    min-height: 72px;
  }

  .leaderboard-avatar {
    width: 36px;
    height: 36px;
  }

  .leaderboard-count {
    grid-column: 3;
    grid-row: 2;
    margin-top: -12px;
  }
}
</style>
