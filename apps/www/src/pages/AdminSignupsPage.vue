<template>
  <AdminAuthGate>
    <AdminPageTemplate title="Tilmeldte frivillige" copy="Se hvem der er tilmeldt de forskellige sektioner i arrangementet.">
      <PageCard>
      <div class="page-heading">
        <div>
          <p class="eyebrow">Tilmeldinger</p>
          <h1>{{ event?.title || 'Tilmeldte frivillige' }}</h1>
        </div>
        <RouterLink class="btn-action" to="/admin/arrangementer">Tilbage til oversigt</RouterLink>
      </div>
      <p v-if="event" class="lead">{{ event.dateText }}<template v-if="event.location"> · {{ event.location }}</template></p>
      <p v-if="actionError" class="admin-error" role="alert">{{ actionError }}</p>
      <p v-if="loading" class="lead">Henter tilmeldte…</p>
      <p v-else-if="error" class="admin-error">{{ error }}</p>
      <p v-else-if="!rows.length" class="admin-empty">Ingen tilmeldte endnu.</p>
      <div v-else-if="rows.length" class="signup-groups">
        <section v-for="group in signupGroups" :key="group.type" class="signup-group" :class="`signup-group--${group.type}`">
          <header class="signup-group-header">
            <h2>{{ group.label }}</h2>
            <span>{{ group.rows.length }} tilmeldt{{ group.rows.length === 1 ? '' : 'e' }}</span>
          </header>
          <ul class="signup-list">
            <li v-for="row in group.rows" :key="row.id" class="signup-item">
              <div class="signup-details">
                <strong>{{ row.name }} <span v-if="row.waitlist" class="waitlist-badge">Venteliste</span></strong>
                <span>{{ row.email }}<template v-if="row.slotDate"> · Vagtdato: {{ row.slotDate }}</template><template v-if="row.slotLabel"> · {{ row.slotLabel }}</template></span>
              </div>
              <div class="signup-actions">
                <button v-if="row.waitlist" type="button" class="btn-action" :disabled="savingId === row.id" @click="approve(row)">Godkend</button>
                <button v-if="availableTargets(row).length" type="button" class="btn-action" :disabled="savingId === row.id" @click="startMove(row)">Flyt</button>
                <button type="button" class="btn-action btn-action--danger" :disabled="savingId === row.id" @click="cancel(row)">Afmeld</button>
              </div>
              <div v-if="movingId === row.id" class="move-controls">
                <label :for="`target-${row.id}`">Flyt til</label>
                <select :id="`target-${row.id}`" v-model="targetSlotId" :disabled="savingId === row.id">
                  <option v-for="slot in availableTargets(row)" :key="slot.id" :value="slot.id">{{ targetLabel(slot) }}</option>
                </select>
                <button type="button" class="btn-action" :disabled="savingId === row.id || !targetSlotId" @click="move(row)">Bekræft flytning</button>
                <button type="button" class="btn-action" :disabled="savingId === row.id" @click="movingId = ''">Annuller</button>
              </div>
            </li>
          </ul>
        </section>
      </div>
      </PageCard>
    </AdminPageTemplate>
  </AdminAuthGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { RouterLink, useRoute } from 'vue-router';
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import AdminPageTemplate from '@/components/admin/AdminPageTemplate.vue';
import PageCard from '@/components/PageCard.vue';
import { fetchAllAdminEvents, formatSlotDate } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventSlot } from '@/features/eventAdmin/eventAdmin.types';
import { calculateSlotDate } from '@/features/eventAdmin/eventScheduling';
import { manageVolunteerSignup } from '@/features/adminSignups/adminSignups.data';
import { getAppFirestore } from '@/lib/firebase';

const route = useRoute();
const event = ref<AdminEvent | null>(null);
type SignupRow = { id: string; name: string; email: string; slotId: string; slotLabel: string; slotDate: string; type: 'signup' | 'task' | 'shift'; waitlist: boolean; groupSize: number; adult: boolean };
const rows = ref<SignupRow[]>([]);
const loading = ref(true);
const error = ref('');
const actionError = ref('');
const savingId = ref('');
const movingId = ref('');
const targetSlotId = ref('');
const signupGroups = computed(() => {
  const definitions = [
    { type: 'signup' as const, label: 'Tilmeldingssektion' },
    { type: 'task' as const, label: 'Opgavesektion' },
    { type: 'shift' as const, label: 'Vagtsektion' },
  ];
  return definitions
    .map(definition => ({ ...definition, rows: rows.value.filter(row => row.type === definition.type) }))
    .filter(group => group.rows.length);
});

async function load() {
  const eventId = typeof route.query.event === 'string' ? route.query.event : '';
  if (!eventId) { loading.value = false; return; }
  try {
    const events = await fetchAllAdminEvents();
    event.value = events.find(item => item.id === eventId) || null;
    const db = await getAppFirestore();
    const [signupsSnap, contactsSnap] = await Promise.all([
      getDocs(query(collection(db, 'signups'), where('eventId', '==', eventId))),
      getDocs(query(collection(db, 'signupContacts'), where('eventId', '==', eventId))),
    ]);
    const contacts = new Map(contactsSnap.docs.map(item => [item.id, item.data()]));
    rows.value = signupsSnap.docs.map(item => {
      const data = item.data();
      const contact = contacts.get(item.id) || {};
      const slot = event.value?.slots.find(candidate => candidate.id === data.slotId);
      const date = slot?.componentType === 'shift' ? calculateSlotDate(event.value?.eventDate, slot) : undefined;
      const slotDate = slot?.componentType === 'shift'
        ? date ? `${formatSlotDate(date)} ${date.slice(0, 4)}` : event.value?.dateText || ''
        : '';
      return { id: item.id, name: String(data.name || contact.name || 'Ukendt'), email: String(contact.email || ''), slotId: String(data.slotId || ''), type: slot?.componentType === 'task' || slot?.componentType === 'shift' ? slot.componentType : 'signup', slotLabel: slot ? `${slot.label}${slot.sublabel ? ` · ${slot.sublabel}` : ''}` : 'Ukendt plads', slotDate, waitlist: data.waitlist === true, groupSize: Math.max(1, Number(data.groupSize) || 1), adult: data.adult === true };
    });
  } catch (err) { console.error('[admin-signups] load failed', err); error.value = 'Kunne ikke hente tilmeldte.'; }
  finally { loading.value = false; }
}

function availableTargets(row: SignupRow): EventSlot[] {
  const source = event.value?.slots.find(slot => slot.id === row.slotId);
  if (!source || source.kind !== 'volunteer') return [];
  return event.value?.slots.filter(slot => slot.id !== row.slotId
    && slot.kind === 'volunteer' && slot.componentType === source.componentType
    && slot.registrationMode !== 'memberService'
    && row.groupSize >= (Number(slot.groupMin) || 1)
    && row.groupSize <= (Number(slot.groupMax) || 1)
    && (!slot.requiresAdult || row.adult)) || [];
}

function targetLabel(slot: EventSlot): string {
  const date = calculateSlotDate(event.value?.eventDate, slot);
  return `${date ? `${formatSlotDate(date)} ${date.slice(0, 4)} · ` : ''}${slot.label}${slot.sublabel ? ` · ${slot.sublabel}` : ''}`;
}

function startMove(row: SignupRow) {
  movingId.value = row.id;
  targetSlotId.value = availableTargets(row)[0]?.id || '';
  actionError.value = '';
}

async function approve(row: SignupRow) {
  if (!window.confirm(`Godkend ${row.name} på ${row.slotLabel}, selvom der ikke er ledige pladser?`)) return;
  savingId.value = row.id;
  actionError.value = '';
  try {
    await manageVolunteerSignup(row.id, 'approve');
    await load();
  } catch (err) { actionError.value = err instanceof Error ? err.message : 'Kunne ikke godkende tilmeldingen.'; }
  finally { savingId.value = ''; }
}

async function move(row: SignupRow) {
  const target = availableTargets(row).find(slot => slot.id === targetSlotId.value);
  const statusText = row.waitlist
    ? 'Tilmeldingen forbliver på venteliste, indtil du godkender den.'
    : 'Hvis målpladsen er fuld, kommer tilmeldingen på venteliste.';
  if (!target || !window.confirm(`Flyt ${row.name} til ${targetLabel(target)}? ${statusText}`)) return;
  savingId.value = row.id;
  actionError.value = '';
  try {
    await manageVolunteerSignup(row.id, 'move', target.id);
    movingId.value = '';
    await load();
  } catch (err) { actionError.value = err instanceof Error ? err.message : 'Kunne ikke flytte tilmeldingen.'; }
  finally { savingId.value = ''; }
}

async function cancel(row: { id: string; name: string }) {
  if (!window.confirm(`Afmeld ${row.name}?`)) return;
  const db = await getAppFirestore();
  await Promise.all([deleteDoc(doc(db, 'signups', row.id)), deleteDoc(doc(db, 'signupContacts', row.id))]);
  rows.value = rows.value.filter(item => item.id !== row.id);
}

onMounted(() => void load());
</script>

<style scoped>
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-heading h1 { margin: 0; }
.signup-groups { display: grid; gap: 18px; margin-top: 20px; }
.signup-group { padding: 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--row-bg); }
.signup-group--task { border-color: #e4c86a; background: #fffdf2; }
.signup-group--shift { border-color: #b8d0e8; background: #f4f9ff; }
.signup-group-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-soft); }
.signup-group-header h2 { margin: 0; color: var(--navy); font-size: 1.1rem; }
.signup-group-header span { color: var(--muted); font-size: .9rem; font-weight: 700; }
.signup-list { display: grid; gap: 10px; margin: 12px 0 0; padding: 0; list-style: none; }
.signup-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px 16px; padding: 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--row-bg); }
.signup-details { display: grid; gap: 4px; min-width: 0; }
.signup-details > span { color: var(--muted); overflow-wrap: anywhere; }
.waitlist-badge { display: inline-block; margin-left: 8px; padding: 3px 8px; border-radius: 999px; background: #fff1c2; color: #765600; font-size: .75rem; vertical-align: middle; }
.signup-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.move-controls { grid-column: 1 / -1; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-soft); }
.move-controls label { font-weight: 700; color: var(--navy); }
.move-controls select { flex: 1 1 260px; min-width: 0; padding: 10px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: #fff; color: var(--text); font: inherit; }
@media (max-width: 640px) { .page-heading { flex-direction: column; } .signup-item { grid-template-columns: 1fr; } .move-controls { grid-column: 1; } }
</style>
