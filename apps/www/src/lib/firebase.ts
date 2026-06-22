import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';

type FirebaseConfig = {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
};

const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

let firestorePromise: Promise<ReturnType<typeof getFirestore>> | null = null;

function createLocalConfig(): FirebaseConfig {
  return {
    projectId: 'havets-helte',
    apiKey: 'demo',
    authDomain: 'havets-helte.firebaseapp.com',
    storageBucket: 'havets-helte.appspot.com',
  };
}

async function loadFirebaseConfig(): Promise<FirebaseConfig> {
  if (isLocal) return createLocalConfig();
  const response = await fetch('/__/firebase/init.json');
  return response.json();
}

async function initFirestore() {
  const firebaseConfig = await loadFirebaseConfig();
  if (!firebaseConfig.storageBucket && firebaseConfig.projectId) {
    firebaseConfig.storageBucket = `${firebaseConfig.projectId}.appspot.com`;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = isLocal
    ? initializeFirestore(app, { experimentalForceLongPolling: true })
    : getFirestore(app);

  if (isLocal) {
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
  }

  return db;
}

export function getAppFirestore() {
  if (!firestorePromise) {
    firestorePromise = initFirestore();
  }
  return firestorePromise;
}
