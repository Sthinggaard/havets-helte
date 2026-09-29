<template>
  <PublicLandingPageShell
    content-width="70vw"
    hero-badge="Lederportal"
    :hero-copy="heroCopy"
    :hero-count-label="heroCountLabel"
    :hero-image="heroImage"
    hero-image-alt="Grene"
    :hero-title="heroTitle"
    :section-chip="sectionChip"
    section-eyebrow="Grene"
    :section-lead="sectionLead"
    :section-title="sectionTitle"
  >
    <template #hero-actions>
      <button v-if="mode === 'form'" type="button" class="hero-action" @click="cancelBranchEditing">
        <i class="ti ti-layout-list" aria-hidden="true"></i>Tilbage til oversigt
      </button>
    </template>

    <template #hero-meta>
      <span class="meta-chip">
        <i class="ti ti-git-branch" aria-hidden="true"></i>
        {{ heroCountLabel }}
      </span>
      <span class="meta-chip">
        <i class="ti ti-edit" aria-hidden="true"></i>
        {{ mode === 'form' ? 'Formular' : 'Oversigt' }}
      </span>
    </template>

    <template #info>
      <span class="info-chip">
        <i class="ti ti-users" aria-hidden="true"></i>
        {{ mode === 'list' ? 'Klik på en gren for at redigere' : formBranch ? `${formBranch.memberCount} medlemmer` : 'Ny gren' }}
      </span>
      <span class="info-chip">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        {{ mode === 'list' ? 'Mødedage og alder' : draftMeetingDays || 'Tilføj mødedage' }}
      </span>
    </template>

    <template #body>
      <section v-if="mode === 'list'" class="admin-list">
        <div class="admin-list-head">
          <div class="admin-list-head-main">
            <p class="admin-list-eyebrow">Oversigt</p>
            <h2 class="admin-list-title">Grene</h2>
            <p class="admin-list-sub">Åbn en gren for at redigere den, eller opret en ny øverst.</p>
          </div>
          <button type="button" class="btn-action btn-action--primary admin-list-create" @click="startCreateBranch">
            <i class="ti ti-plus" aria-hidden="true"></i>Ny gren
          </button>
        </div>

        <p v-if="!branchCards.length" class="admin-empty">Ingen grene endnu.</p>

        <ul v-else class="admin-cards">
          <li v-for="branch in branchCards" :key="branch.id" class="admin-card">
            <button type="button" class="admin-card-main" @click="startEditBranch(branch.id)">
              <div class="admin-card-body">
                <div class="admin-card-title-row">
                  <span class="admin-card-title">{{ branch.label }}</span>
                  <div class="admin-card-badges">
                    <span class="admin-status-chip" :class="branch.active ? 'active' : 'inactive'">
                      {{ branch.statusLabel }}
                    </span>
                    <span class="pill">{{ branch.memberCount }} medlemmer</span>
                  </div>
                </div>
                <div class="admin-card-meta">
                  <span>{{ branch.ageRangeLabel }}</span>
                <span>· {{ branch.meetingSchedules?.map(day => `${day.weekday}${day.startTime && day.endTime ? ` ${day.startTime}–${day.endTime}` : ''}`).join(', ') ?? branch.meetingDays.join(', ') }}</span>
                </div>
                <div class="admin-card-copy">{{ branch.focus }}</div>
              </div>
            </button>
            <div class="admin-card-actions">
              <button type="button" class="btn-action" @click="startEditBranch(branch.id)">Rediger</button>
            </div>
          </li>
        </ul>
      </section>

      <form v-else class="admin-form" @submit.prevent="onSaveBranch">
        <div class="field">
          <label for="branchLabel">Navn</label>
          <input id="branchLabel" v-model="draftLabel" type="text" class="form-input" placeholder="Søspejder mini" />
        </div>

        <div class="field">
          <label class="check-row">
            <input v-model="draftActive" type="checkbox" />
            <span>Aktiv (synlig i appen)</span>
          </label>
        </div>

        <div class="field">
          <label>Aldersinterval</label>
          <div class="age-slider-card">
            <div class="age-slider-shell">
              <label class="age-slider-bubble age-slider-bubble--min" :style="{ left: `${draftMinAgePercent}%` }">
                <input
                  class="age-bubble-input"
                  type="number"
                  :min="sliderMinAge"
                  :max="sliderMaxAge"
                  :value="draftMinAge"
                  @input="onMinAgeInput"
                />
                <span class="age-bubble-suffix">år</span>
              </label>
              <label class="age-slider-bubble age-slider-bubble--max" :style="{ left: `${draftMaxAgePercent}%` }">
                <input
                  class="age-bubble-input"
                  type="number"
                  :min="sliderMinAge"
                  :max="sliderMaxAge"
                  :value="draftMaxAge"
                  @input="onMaxAgeInput"
                />
                <span class="age-bubble-suffix">{{ draftMaxAge >= sliderMaxAge ? '+' : 'år' }}</span>
              </label>
              <div class="age-slider-rail"></div>
              <div
                class="age-slider-range"
                :style="{ left: `${draftMinAgePercent}%`, width: `${draftMaxAgePercent - draftMinAgePercent}%` }"
              ></div>
              <input
                v-model.number="draftMinAge"
                class="age-slider age-slider--min"
                type="range"
                :min="sliderMinAge"
                :max="sliderMaxAge"
                step="1"
              />
              <input
                v-model.number="draftMaxAge"
                class="age-slider age-slider--max"
                type="range"
                :min="sliderMinAge"
                :max="sliderMaxAge"
                step="1"
              />
            </div>
            <div class="age-slider-endpoints">
              <span>{{ sliderMinAge }} år</span>
              <span>{{ sliderMaxAge }}+</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="branchFocus">Fokus</label>
          <textarea
            id="branchFocus"
            v-model="draftFocus"
            class="form-input"
            rows="3"
            placeholder="Leg, vandtilvænning og fællesskab"
          />
        </div>

        <section class="branch-members">
          <div class="divider">Mødedage og tid</div>
          <div v-for="(day, index) in draftMeetingSchedules" :key="`${day.weekday}-${index}`" class="schedule-row">
            <select v-model="day.weekday" class="form-input" aria-label="Ugedag">
              <option v-for="weekday in weekdays" :key="weekday" :value="weekday">{{ weekday }}</option>
            </select>
            <select :value="day.startTime" class="form-input" :aria-label="`${day.weekday} starttid`" @change="updateMeetingStart(day, ($event.target as HTMLSelectElement).value)">
              <option value="">Vælg starttid</option><option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
            </select>
            <span>til {{ day.endTime || '—' }}</span>
            <button type="button" class="btn-action" aria-label="Fjern mødedag" @click="removeMeetingDay(index)">Fjern</button>
          </div>
          <button type="button" class="btn-action" @click="addMeetingDay">+ Tilføj mødedag</button>
        </section>

        <div v-if="draftError" class="field-error" role="alert">{{ draftError }}</div>

        <div class="form-footer">
          <button type="submit" class="btn-action btn-action--primary">
            {{ isCreating ? 'Opret gren' : 'Gem gren' }}
          </button>
          <button type="button" class="btn-action" @click="cancelBranchEditing">Tilbage</button>
        </div>

        <section v-if="formBranch" class="branch-members">
          <div class="divider">Medlemmer i grenen</div>
          <div class="stacked-list">
            <article v-for="member in branchMembers" :key="member.id" class="member-compact-row">
              <span class="member-av">{{ member.initials }}</span>
              <div class="member-card-main">
                <div class="member-card-title">{{ member.name }}</div>
                <div class="member-card-meta">
                  <span>{{ member.team }}</span>
                  <span>{{ member.weekday }}</span>
                </div>
              </div>
            </article>
            <div v-if="!branchMembers.length" class="admin-empty">Ingen medlemmer i denne gren endnu.</div>
          </div>
        </section>

        <section v-if="formBranch" class="branch-members">
          <div class="divider">Hold i grenen</div>
          <div class="stacked-list">
            <article v-for="team in branchTeams" :key="team.id" class="member-compact-row">
              <div class="member-card-main">
                <div class="member-card-title">{{ team.label }}</div>
                <div class="member-card-meta"><span>{{ team.weekday }} · {{ team.startTime }}–{{ team.endTime }}</span><span>{{ team.seasonStartDate || '—' }} til {{ team.seasonEndDate || '—' }}</span></div>
              </div>
              <button type="button" class="btn-action" @click="startEditTeam(team)">Rediger</button>
            </article>
            <div v-if="!branchTeams.length" class="admin-empty">Ingen hold i grenen endnu.</div>
          </div>
          <button v-if="!showTeamForm" type="button" class="btn-action" @click="startCreateTeam">+ Tilføj hold</button>
          <div v-if="showTeamForm" class="team-editor">
            <div class="field"><label for="teamName">{{ editingTeamId ? 'Rediger hold' : 'Nyt hold' }}</label><input id="teamName" v-model="draftTeam.label" class="form-input" placeholder="Fx Tirsdagshold" /></div>
            <div class="team-fields">
              <label class="field"><span>Ugedag</span><select :value="draftTeam.weekday" class="form-input" @change="selectTeamWeekday(($event.target as HTMLSelectElement).value)"><option v-for="day in draftMeetingSchedules" :key="day.weekday" :value="day.weekday">{{ day.weekday }}</option></select></label>
              <label class="field"><span>Starttid</span><select :value="draftTeam.startTime" class="form-input" @change="updateTeamStart(($event.target as HTMLSelectElement).value)"><option value="">Vælg starttid</option><option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option></select></label>
              <div class="field"><span>Sluttid</span><output class="form-input generated-time">{{ draftTeam.endTime || 'Vælg starttid' }}</output></div>
              <label class="field"><span>Sæson fra</span><input v-model="draftTeam.seasonStartDate" type="date" class="form-input" /></label>
              <label class="field"><span>Sæson til</span><input v-model="draftTeam.seasonEndDate" type="date" class="form-input" /></label>
            </div>
            <p v-if="teamError" class="field-error" role="alert">{{ teamError }}</p>
            <div class="form-footer"><button type="button" class="btn-action btn-action--primary" @click="onSaveTeam">{{ editingTeamId ? 'Gem hold' : 'Opret hold' }}</button><button v-if="editingTeamId" type="button" class="btn-action" @click="resetTeamDraft">Annuller</button></div>
          </div>
        </section>
      </form>
    </template>

    <template #toast>
      <div class="toast" :class="{ show: toastVisible }">{{ toastText }}</div>
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import PublicLandingPageShell from '@/components/public/PublicLandingPageShell.vue';
import { useBranchesPage } from '@/features/branches/useBranchesPage';

const {
  branchCards,
  branchMembers,
  branchTeams,
  addMeetingDay,
  cancelBranchEditing,
  draftActive,
  draftError,
  draftFocus,
  draftLabel,
  draftLowerAge,
  draftMaxAgePercent,
  draftMaxAge,
  draftMeetingDays,
  draftMeetingSchedules,
  draftMinAgePercent,
  draftMinAge,
  draftUpperAge,
  formBranch,
  isCreating,
  mode,
  setDraftMaxAge,
  setDraftMinAge,
  sliderMaxAge,
  sliderMinAge,
  saveBranch,
  startCreateBranch,
  startEditBranch,
  removeMeetingDay,
  draftTeam,
  teamError,
  editingTeamId,
  showTeamForm,
  resetTeamDraft,
  startEditTeam,
  startCreateTeam,
  selectTeamWeekday,
  saveTeam,
} = useBranchesPage();

const weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
const timeOptions = Array.from({ length: 40 }, (_, index) => `${String(Math.floor(index * 30 / 60)).padStart(2, '0')}:${String(index * 30 % 60).padStart(2, '0')}`);

function timeAfterFourHours(start: string) {
  if (!start) return '';
  const [hours, minutes] = start.split(':').map(Number);
  const total = hours * 60 + minutes + 240;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function updateMeetingStart(day: { startTime: string; endTime: string }, start: string) {
  day.startTime = start;
  day.endTime = timeAfterFourHours(start);
}

function updateTeamStart(start: string) {
  draftTeam.startTime = start;
  draftTeam.endTime = timeAfterFourHours(start);
}

const heroImage = '/og-sankthans.webp';

const heroCountLabel = computed(() => `${branchCards.value.length} ${branchCards.value.length === 1 ? 'gren' : 'grene'}`);
const heroTitle = computed(() => (mode.value === 'form' ? (isCreating.value ? 'Ny gren' : draftLabel.value || formBranch.value?.label || 'Rediger gren') : 'Administrer grene'));
const heroCopy = computed(() =>
  mode.value === 'form'
    ? 'Ret navn, alder, fokus og mødedage i samme editor som resten af admin.'
    : 'Vælg en gren fra listen og åbn den som en redigerbar admin-side.',
);
const sectionTitle = computed(() => (mode.value === 'form' ? (isCreating.value ? 'Ny gren' : 'Rediger gren') : 'Gren-oversigt'));
const sectionChip = computed(() =>
  mode.value === 'form'
    ? (draftActive.value ? 'Synlig' : 'Skjult')
    : heroCountLabel.value,
);
const sectionLead = computed(() =>
  mode.value === 'form'
    ? formBranch.value
      ? `${formBranch.value.meetingDays.join(', ')} · ${formBranch.value.memberCount} medlemmer`
      : 'Opret en ny gren og vælg om den skal være synlig med det samme.'
    : 'Klik på en gren for at åbne dens redigeringsside.',
);
const toastVisible = ref(false);
const toastText = ref('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function onMinAgeInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  setDraftMinAge(value);
}

function onMaxAgeInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  setDraftMaxAge(value);
}

function showToast(message: string) {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
    toastTimer = null;
  }, 3200);
}

function onSaveBranch() {
  const wasCreating = isCreating.value;
  const branchName = draftLabel.value.trim();
  const saved = saveBranch();
  if (!saved) return;
  showToast(wasCreating ? `Gren oprettet: ${branchName}` : `Gren gemt: ${branchName}`);
  cancelBranchEditing();
}

function onSaveTeam() {
  const wasEditing = Boolean(editingTeamId.value);
  if (saveTeam()) showToast(wasEditing ? 'Holdet er gemt' : 'Holdet er oprettet');
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.hero-action,
.meta-chip,
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.hero-action {
  justify-content: center;
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.meta-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 0.84rem;
  font-weight: 700;
}

.info-chip {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f4f8fb;
  color: var(--navy-dark);
  font-size: 0.84rem;
  font-weight: 700;
}

.admin-list,
.admin-form {
  display: grid;
  gap: 16px;
}

.admin-list-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-list-head-main {
  display: grid;
  gap: 4px;
}

.admin-list-eyebrow {
  margin: 0;
  color: var(--navy);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.admin-list-title,
.admin-list-sub,
.admin-empty,
.admin-card-copy {
  margin: 0;
}

.admin-list-title {
  color: var(--navy-dark);
  font-size: 1.3rem;
  font-weight: 800;
}

.admin-list-sub,
.admin-empty,
.admin-card-copy {
  color: var(--muted);
}

.admin-cards {
  display: grid;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.admin-card {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
}

.admin-card-main {
  flex: 1;
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.admin-card-body {
  display: grid;
  gap: 8px;
}

.admin-card-title-row,
.admin-card-actions,
.form-footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.admin-card-title {
  color: var(--navy-dark);
  font-size: 1.02rem;
  font-weight: 800;
}

.admin-card-badges {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.admin-card-meta {
  color: var(--muted);
  font-size: 0.9rem;
}

.pill,
.admin-status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.pill {
  background: var(--row-bg);
  color: var(--navy);
}

.admin-status-chip.active {
  background: rgba(38, 121, 73, 0.12);
  color: #267949;
}

.admin-status-chip.inactive {
  background: rgba(124, 84, 0, 0.12);
  color: #7c5400;
}

.field {
  display: grid;
  gap: 6px;
}

.field label {
  color: var(--navy-dark);
  font-size: 0.84rem;
  font-weight: 700;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-input {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  font: inherit;
}

textarea.form-input {
  min-height: 96px;
  resize: vertical;
}

.form-input:focus {
  outline: none;
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(15, 65, 114, 0.12);
}

.divider {
  padding-top: 4px;
  border-top: 1px solid var(--border);
  color: var(--navy);
  font-size: 0.95rem;
  font-weight: 700;
}

.branch-members {
  display: grid;
  gap: 14px;
}

.schedule-row,
.team-fields {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(110px, 0.8fr) auto minmax(110px, 0.8fr) auto;
  align-items: center;
  gap: 10px;
}

.generated-time { display: flex; align-items: center; color: var(--muted); }

.team-editor {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--row-bg);
}

.team-fields {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.field-error {
  color: var(--danger);
  font-size: 0.84rem;
  font-weight: 700;
}

.age-slider-card {
  display: grid;
  gap: 18px;
  padding: 20px 16px 14px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--row-bg);
}

.age-slider-shell {
  position: relative;
  height: 92px;
}

.age-slider-card:focus-within {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

.age-slider-bubble {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: var(--shadow-flat);
}

.age-bubble-input {
  width: 42px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  text-align: right;
  appearance: textfield;
}

.age-bubble-input::-webkit-outer-spin-button,
.age-bubble-input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.age-bubble-input:focus {
  outline: none;
}

.age-bubble-suffix {
  margin-left: 4px;
}

.age-slider-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -8px;
  transform: translateX(-50%);
  border-width: 8px 7px 0 7px;
  border-style: solid;
  border-color: var(--surface) transparent transparent transparent;
}

.age-slider-rail,
.age-slider-range {
  position: absolute;
  top: 62px;
  height: 10px;
  border-radius: 999px;
}

.age-slider-rail {
  right: 0;
  left: 0;
  background: #c6c6c6;
}

.age-slider-range {
  background: var(--accent);
}

.age-slider {
  position: absolute;
  top: 45px;
  left: 0;
  width: 100%;
  height: 44px;
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: none;
}

.age-slider::-webkit-slider-runnable-track {
  height: 10px;
  background: transparent;
}

.age-slider::-moz-range-track {
  height: 10px;
  background: transparent;
}

.age-slider::-webkit-slider-thumb {
  appearance: none;
  width: 28px;
  height: 28px;
  margin-top: -9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-flat);
  cursor: pointer;
  pointer-events: auto;
}

.age-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-flat);
  cursor: pointer;
  pointer-events: auto;
}

.age-slider:focus {
  outline: none;
}

.age-slider-endpoints {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(120%);
  background: var(--navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.28s var(--ease-out-quint);
  z-index: 60;
}

.toast.show {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 640px) {
  .admin-list-head {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-list-create,
  .admin-card-actions .btn-action,
  .form-footer .btn-action {
    width: 100%;
    justify-content: center;
  }

  .admin-card {
    flex-direction: column;
    align-items: stretch;
  }

  .schedule-row,
  .team-fields {
    grid-template-columns: 1fr 1fr;
  }

  .schedule-row > span { display: none; }
}
</style>
