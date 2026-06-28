import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectAuthEmulator, getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';

type FirebaseConfig = {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
};

const emulatorOverride = import.meta.env.VITE_USE_FIREBASE_EMULATORS;
const useEmulators = emulatorOverride !== undefined ? emulatorOverride === 'true' : import.meta.env.DEV;

// Per-environment Firebase web config. CI builds with `vite build --mode
// dev|stage|prod`, which loads the matching apps/www/.env.<mode> file and
// supplies these VITE_FIREBASE_* values. The hardcoded fallbacks keep the
// production project working when the env file is absent (e.g. a bare
// `npm run dev`/`npm run build`). Firebase web config is not secret — it ships
// in the client bundle regardless.
const liveFirebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBK5bi8bQ4-gFFgmzkESqumeTlbqeIWFbM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'havets-helte.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'havets-helte',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'havets-helte.firebasestorage.app',
};

let firestorePromise: Promise<ReturnType<typeof getFirestore>> | null = null;
let storagePromise: Promise<ReturnType<typeof getStorage>> | null = null;
let authPromise: Promise<Auth> | null = null;

function createEmulatorConfig(): FirebaseConfig {
  return {
    projectId: liveFirebaseConfig.projectId,
    apiKey: 'demo',
    authDomain: liveFirebaseConfig.authDomain,
    storageBucket: liveFirebaseConfig.storageBucket,
  };
}

async function loadFirebaseConfig(): Promise<FirebaseConfig> {
  return useEmulators ? createEmulatorConfig() : liveFirebaseConfig;
}

async function initFirestore() {
  const firebaseConfig = await loadFirebaseConfig();
  if (!firebaseConfig.storageBucket && firebaseConfig.projectId) {
    firebaseConfig.storageBucket = `${firebaseConfig.projectId}.appspot.com`;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = useEmulators
    ? initializeFirestore(app, { experimentalForceLongPolling: true })
    : getFirestore(app);

  if (useEmulators) {
    connectFirestoreEmulator(db, 'localhost', 8081);
  }

  return db;
}

export function getAppFirestore() {
  if (!firestorePromise) {
    firestorePromise = initFirestore();
  }
  return firestorePromise;
}

async function initStorage() {
  const firebaseConfig = await loadFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const storage = getStorage(app);

  if (useEmulators) {
    connectStorageEmulator(storage, 'localhost', 9199);
  }

  return storage;
}

export function getAppStorage() {
  if (!storagePromise) {
    storagePromise = initStorage();
  }
  return storagePromise;
}

async function initAuth() {
  const firebaseConfig = await loadFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://localhost:9097', { disableWarnings: true });
  }

  return auth;
}

export function getAppAuth() {
  if (!authPromise) {
    authPromise = initAuth();
  }
  return authPromise;
}

export async function waitForAppAuthReady(): Promise<User | null> {
  const auth = await getAppAuth();
  if (auth.currentUser !== null) {
    return auth.currentUser;
  }

  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}
