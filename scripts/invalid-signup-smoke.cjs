const { initializeApp } = require('../apps/www/node_modules/firebase/app');
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} = require('../apps/www/node_modules/firebase/firestore');

const projectId = 'havets-helte';

const clientApp = initializeApp({ projectId, apiKey: 'demo' }, 'invalid-signup-smoke-client');
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, '127.0.0.1', 8081);

async function expectRejected(label, data) {
  try {
    await setDoc(doc(collection(clientDb, 'signups')), data);
  } catch (error) {
    if (error.code === 'permission-denied') return;
    throw new Error(`${label}: expected permission-denied, got ${error.code || error.message}`);
  }
  throw new Error(`${label}: expected the write to be rejected, but it succeeded`);
}

async function main() {
  await expectRejected('missing eventId', {
    slotId: 'slot-a',
    name: 'Invalid Test',
    adult: true,
    groupSize: 1,
    created: serverTimestamp(),
  });

  await expectRejected('missing slotId', {
    eventId: 'event-a',
    name: 'Invalid Test',
    adult: true,
    groupSize: 1,
    created: serverTimestamp(),
  });

  await expectRejected('empty name', {
    eventId: 'event-a',
    slotId: 'slot-a',
    name: '',
    adult: true,
    groupSize: 1,
    created: serverTimestamp(),
  });

  await expectRejected('groupSize out of range', {
    eventId: 'event-a',
    slotId: 'slot-a',
    name: 'Invalid Test',
    adult: true,
    groupSize: 999,
    created: serverTimestamp(),
  });

  await expectRejected('extra unexpected field', {
    eventId: 'event-a',
    slotId: 'slot-a',
    name: 'Invalid Test',
    adult: true,
    groupSize: 1,
    created: serverTimestamp(),
    isAdmin: true,
  });

  console.log('signup_validation_smoke_ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
