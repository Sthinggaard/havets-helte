<template>
  <PublicLandingPageShell
    hero-title="Se mine tilmeldinger"
    hero-copy="Få adgang til dine arrangementer og frivillige opgaver med et link på mail."
    section-title=""
    section-eyebrow=""
  >
    <template #body>
      <PageCard v-if="checkingLink || !ready">
        <p class="parent-access-status" aria-live="polite">Gør klar…</p>
      </PageCard>

      <PageCard v-else-if="linkNeedsEmail">
        <template #header>
          <div>
            <p class="eyebrow">Åbn adgangslink</p>
            <h2 class="page-title">Bekræft din mail</h2>
          </div>
        </template>
        <form class="parent-access-form" @submit.prevent="redeemLink">
          <label for="link-email">E-mail</label>
          <input id="link-email" v-model.trim="email" type="email" autocomplete="email" required>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="btn-action btn-action--primary" type="submit" :disabled="redeeming">
            {{ redeeming ? 'Åbner…' : 'Åbn mine tilmeldinger' }}
          </button>
        </form>
      </PageCard>

      <PageCard v-else-if="!user">
        <template #header>
          <div>
            <p class="eyebrow">Passwordfrit</p>
            <h2 class="page-title">Indtast din e-mail</h2>
          </div>
        </template>
        <form class="parent-access-form" @submit.prevent="requestLink">
          <label for="parent-email">E-mail</label>
          <input id="parent-email" v-model.trim="email" type="email" autocomplete="email" required>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="btn-action btn-action--primary" type="submit" :disabled="requesting">
            {{ requesting ? 'Sender…' : 'Send adgangslink' }}
          </button>
        </form>
        <div v-if="linkSent" class="parent-access-success" role="status">
          <strong>Tjek din mail</strong>
          <span>Vi har sendt et link, som giver adgang til dine tilmeldinger.</span>
        </div>
      </PageCard>

      <PageCard v-else>
        <template #header>
          <div>
            <p class="eyebrow">Din oversigt</p>
            <h2 class="page-title">Mine tilmeldinger</h2>
          </div>
          <button type="button" class="parent-access-logout" @click="logout">Log ud</button>
        </template>

        <div v-if="loading" class="parent-access-status" aria-live="polite">Henter dine tilmeldinger…</div>
        <div v-else-if="error" class="parent-access-error" role="alert">{{ error }}</div>
        <div v-else-if="signups.length === 0" class="parent-access-empty">
          <strong>Ingen tilmeldinger endnu</strong>
          <span>Find en opgave under Arrangementer, Opgaver eller Vagter.</span>
        </div>
        <ul v-else class="parent-signup-list">
          <li v-for="signup in signups" :key="signup.id" class="parent-signup">
            <button type="button" class="parent-signup__details" @click="openEvent(signup)">
              <strong>{{ signup.eventTitle }}</strong>
              <span>{{ signup.dateText }}<template v-if="signup.location"> · {{ signup.location }}</template></span>
              <span>{{ signup.slotLabel }}<template v-if="signup.groupSize > 1"> · {{ signup.groupSize }} deltagere</template><template v-if="signup.audienceGroupLabel"> · {{ signup.audienceGroupLabel }}</template></span>
              <span v-if="signup.waitlist" class="parent-signup__status">Venteliste</span>
              <span class="parent-signup__link">Se arrangementet →</span>
            </button>
            <button type="button" class="parent-signup__cancel" :disabled="cancelling === signup.id" @click="cancel(signup)">
              {{ cancelling === signup.id ? 'Afmelder…' : 'Afmeld' }}
            </button>
          </li>
        </ul>
      </PageCard>
    </template>
    <template #modal>
      <ConfirmDialog
        :open="!!cancelTarget"
        title="Afmeld tilmelding?"
        :message="cancelTarget ? `Du afmeldes fra ${cancelTarget.eventTitle}.` : ''"
        confirm-label="Afmeld"
        @confirm="confirmCancel"
        @cancel="cancelTarget = null"
      />
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, signOut, type User } from 'firebase/auth';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import PageCard from '@/components/PageCard.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PublicLandingPageShell from '@/components/public/PublicLandingPageShell.vue';
import { isAdminEmail } from '@/features/admin/useAdminAuth';
import { cancelParentSignup, loadParentSignups, requestParentAccessLink, type ParentSignup } from '@/features/parentAccess/parentAccess.data';
import { getAppAuth } from '@/lib/firebase';

const EMAIL_STORAGE_KEY = 'havetshelte.parentAccess.email';
const router = useRouter();
const user = ref<User | null>(null);
const ready = ref(false);
const checkingLink = ref(true);
const linkNeedsEmail = ref(false);
const email = ref('');
const error = ref('');
const linkSent = ref(false);
const requesting = ref(false);
const redeeming = ref(false);
const loading = ref(false);
const cancelling = ref('');
const cancelTarget = ref<ParentSignup | null>(null);
const signups = ref<ParentSignup[]>([]);
let unsubscribe: (() => void) | null = null;

function clearLinkQuery() {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.search = '';
  window.history.replaceState({}, '', cleanUrl.toString());
}

async function redeemLink() {
  const auth = await getAppAuth();
  if (!email.value || !isSignInWithEmailLink(auth, window.location.href)) return;
  redeeming.value = true;
  error.value = '';
  try {
    await signInWithEmailLink(auth, email.value, window.location.href);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
    clearLinkQuery();
    linkNeedsEmail.value = false;
  } catch (err) {
    console.error('[parent-access] link redemption failed', err);
    error.value = 'Linket er udløbet eller allerede brugt. Bed om et nyt link.';
  } finally {
    redeeming.value = false;
  }
}

async function requestLink() {
  const normalized = email.value.trim().toLowerCase();
  if (!normalized.includes('@')) {
    error.value = 'Indtast en gyldig mailadresse.';
    return;
  }
  if (isAdminEmail(normalized)) {
    await router.push('/admin');
    return;
  }
  requesting.value = true;
  error.value = '';
  try {
    await requestParentAccessLink(normalized, '/mine');
    localStorage.setItem(EMAIL_STORAGE_KEY, normalized);
    linkSent.value = true;
  } catch (err) {
    console.error('[parent-access] access request failed', err);
    error.value = 'Linket kunne ikke sendes lige nu. Prøv igen.';
  } finally {
    requesting.value = false;
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const response = await loadParentSignups();
    signups.value = response.signups;
  } catch (err) {
    console.error('[parent-access] loading signups failed', err);
    error.value = 'Dine tilmeldinger kunne ikke hentes. Åbn et nyt adgangslink.';
  } finally {
    loading.value = false;
  }
}

function cancel(signup: ParentSignup) {
  cancelTarget.value = signup;
}

function openEvent(signup: ParentSignup) {
  const path = signup.eventType === 'timed' ? '/vagter' : signup.eventType === 'task' ? '/opgaver' : '/events';
  router.push({ path, query: { event: signup.eventId } });
}

async function confirmCancel() {
  const signup = cancelTarget.value;
  if (!signup) return;
  cancelTarget.value = null;
  cancelling.value = signup.id;
  error.value = '';
  try {
    await cancelParentSignup(signup.id);
    signups.value = signups.value.filter(item => item.id !== signup.id);
  } catch (err) {
    console.error('[parent-access] cancellation failed', err);
    error.value = 'Tilmeldingen kunne ikke afmeldes. Prøv igen.';
  } finally {
    cancelling.value = '';
  }
}

async function logout() {
  const auth = await getAppAuth();
  await signOut(auth);
  signups.value = [];
  await router.replace('/');
}

onMounted(async () => {
  const auth = await getAppAuth();
  unsubscribe = onAuthStateChanged(auth, async nextUser => {
    user.value = nextUser;
    ready.value = true;
    checkingLink.value = false;
    if (nextUser && isAdminEmail(nextUser.email)) {
      await router.replace('/admin/mine');
      return;
    }
    if (nextUser) await load();
  });

  if (isSignInWithEmailLink(auth, window.location.href)) {
    email.value = localStorage.getItem(EMAIL_STORAGE_KEY) || '';
    linkNeedsEmail.value = !email.value;
    if (email.value) await redeemLink();
  } else {
    checkingLink.value = false;
  }
});

onBeforeUnmount(() => unsubscribe?.());
</script>

<style scoped>
.parent-access-page { min-height: 100vh; background: var(--bg); }
.parent-access-hero { background: var(--navy); color: #fff; padding: clamp(48px, 8vw, 88px) 20px 56px; }
.parent-access-hero__inner { width: min(720px, 100%); margin: 0 auto; }
.parent-access-hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 6vw, 3.4rem); line-height: 1.05; }
.parent-access-hero p:last-child { margin: 0; max-width: 520px; color: #d8e7f3; font-size: 1.1rem; }
.parent-access-content { width: min(720px, calc(100% - 32px)); margin: -28px auto 48px; position: relative; }
.parent-access-form { display: grid; gap: 10px; max-width: 480px; }
.parent-access-form label { font-weight: 700; }
.parent-access-form input { min-height: 48px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; font: inherit; }
.parent-access-form button { margin-top: 8px; justify-self: start; }
.form-error, .parent-access-error { color: var(--danger); font-weight: 700; }
.parent-access-success, .parent-access-empty { display: grid; gap: 4px; margin-top: 18px; padding: 14px; border-left: 4px solid var(--teal); background: var(--navy-soft); }
.parent-access-status { color: var(--muted); }
.page-card__header { align-items: flex-start; }
.parent-access-logout { min-height: 44px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent; color: var(--navy); font: inherit; font-weight: 700; padding: 8px 12px; cursor: pointer; }
.parent-signup-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.parent-signup { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding: 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); background: var(--row-bg); }
.parent-signup > div { display: grid; gap: 4px; }
.parent-signup__details { display: grid; gap: 4px; flex: 1; border: 0; padding: 0; background: transparent; color: inherit; text-align: left; font: inherit; cursor: pointer; }
.parent-signup__details:focus-visible { outline: 3px solid var(--teal); outline-offset: 4px; border-radius: 4px; }
.parent-signup__link { color: var(--navy) !important; font-weight: 700; margin-top: 4px; }
.parent-signup span { color: var(--muted); font-size: .92rem; }
.parent-signup__status { color: var(--navy) !important; font-weight: 700; }
.parent-signup__cancel { min-height: 44px; border: 1px solid var(--danger); border-radius: var(--radius-sm); background: transparent; color: var(--danger); font: inherit; font-weight: 700; padding: 8px 12px; cursor: pointer; white-space: nowrap; }
.parent-signup__cancel:disabled { opacity: .6; cursor: wait; }
@media (max-width: 560px) { .parent-signup { flex-direction: column; } .parent-signup__cancel { width: 100%; } .parent-access-form button { width: 100%; } }
</style>
