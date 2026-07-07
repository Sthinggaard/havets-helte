import { computed, onBeforeUnmount, ref } from 'vue';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import { getAppAuth } from '@/lib/firebase';

// A leader/admin is anyone signed in with a havetshelte.dk email address.
export const ADMIN_EMAIL_DOMAIN = '@havetshelte.dk';

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN);
}

const user = ref<User | null>(null);
const ready = ref(false);
const email = ref('');
const password = ref('');
const busy = ref(false);
const error = ref('');

let unsubscribe: (() => void) | null = null;
let listenerStarted = false;

async function ensureAuthListener() {
  if (listenerStarted) return;
  listenerStarted = true;
  const auth = await getAppAuth();
  unsubscribe = onAuthStateChanged(auth, nextUser => {
    user.value = nextUser;
    ready.value = true;
    if (nextUser) {
      error.value = '';
    }
  });
}

async function login() {
  const auth = await getAppAuth();
  const trimmedEmail = email.value.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    error.value = 'Indtast en gyldig mailadresse.';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await signInWithEmailAndPassword(auth, trimmedEmail, password.value);
    password.value = '';
  } catch (err) {
    console.error('[admin-auth] login failed', err);
    error.value = 'Forkert mail eller adgangskode.';
  } finally {
    busy.value = false;
  }
}

async function loginWithGoogle() {
  const auth = await getAppAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: ADMIN_EMAIL_DOMAIN.slice(1) });
  busy.value = true;
  error.value = '';
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error('[admin-auth] google login failed', err);
    error.value = 'Google-login mislykkedes. Prøv igen.';
  } finally {
    busy.value = false;
  }
}

async function logout() {
  const auth = await getAppAuth();
  await signOut(auth);
}

const isAdmin = computed(() => isAdminEmail(user.value?.email));

export function useAdminAuth() {
  void ensureAuthListener();
  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
    listenerStarted = false;
  });

  return {
    busy,
    email,
    error,
    isAdmin,
    login,
    loginWithGoogle,
    logout,
    password,
    ready,
    user,
  };
}
