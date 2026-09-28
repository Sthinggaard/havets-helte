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
              <div>
                <strong>{{ row.name }}</strong>
                <span>{{ row.email }}<template v-if="row.slotLabel"> · {{ row.slotLabel }}</template></span>
              </div>
              <button type="button" class="btn-action btn-action--danger" @click="cancel(row)">Afmeld</button>
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
import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent } from '@/features/eventAdmin/eventAdmin.types';
import { getAppFirestore } from '@/lib/firebase';

const route = useRoute();
const event = ref<AdminEvent | null>(null);
type SignupRow = { id: string; name: string; email: string; slotLabel: string; type: 'signup' | 'task' | 'shift' };
const rows = ref<SignupRow[]>([]);
const loading = ref(true);
const error = ref('');
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
      return { id: item.id, name: String(data.name || contact.name || 'Ukendt'), email: String(contact.email || ''), type: slot?.componentType === 'task' || slot?.componentType === 'shift' ? slot.componentType : 'signup', slotLabel: slot ? `${slot.label}${slot.sublabel ? ` · ${slot.sublabel}` : ''}` : 'Ukendt plads' };
    });
  } catch (err) { console.error('[admin-signups] load failed', err); error.value = 'Kunne ikke hente tilmeldte.'; }
  finally { loading.value = false; }
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
.signup-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--row-bg); }
.signup-item div { display: grid; gap: 4px; }
.signup-item span { color: var(--muted); }
@media (max-width: 640px) { .page-heading { flex-direction: column; } .signup-item { align-items: flex-start; flex-direction: column; } }
</style>
