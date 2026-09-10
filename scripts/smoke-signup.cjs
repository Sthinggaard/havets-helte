const admin = require('../functions/node_modules/firebase-admin');
const { initializeApp } = require('../apps/www/node_modules/firebase/app');
const {
  getFirestore,
  connectFirestoreEmulator,
  getDoc,
  doc,
} = require('../apps/www/node_modules/firebase/firestore');

const projectId = 'havets-helte';

admin.initializeApp({ projectId });
const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });

const clientApp = initializeApp({ projectId, apiKey: 'demo' }, 'smoke-signup-client');
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, '127.0.0.1', 8081);

async function main() {
  const eventId = `smoke-${Date.now()}`;
  const signupName = 'Smoke Test Parent';
  const signupEmail = 'smoke@example.com';

  await adminDb.collection('events').doc(eventId).set({
    title: 'Smoke test event',
    dateText: '2026-06-19',
    location: 'Test location',
    type: 'timed',
    active: true,
    slots: [
      {
        id: 'slot-a',
        label: 'Test slot',
        sublabel: '09:00-10:00',
        capacity: 1,
        requiresAdult: true,
      },
    ],
  });

  const response = await fetch('http://127.0.0.1:5004/havets-helte/europe-west1/submitSignup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      slotId: 'slot-a',
      name: signupName,
      email: signupEmail,
      adult: true,
      childMode: false,
      groupSize: 1,
      waitlistPreferred: false,
    }),
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'confirmed') {
    throw new Error(`trusted signup failed: ${JSON.stringify(result)}`);
  }
  const signupId = result.signupId;

  const signupSnap = await getDoc(doc(clientDb, 'signups', signupId));
  if (!signupSnap.exists()) {
    throw new Error('signup document was not created');
  }

  const signup = signupSnap.data() || {};
  if (signup.eventId !== eventId || signup.slotId !== 'slot-a' || signup.name !== signupName) {
    throw new Error('signup document content does not match the submitted payload');
  }

  const contactSnap = await adminDb.collection('signupContacts').doc(signupId).get();
  if (!contactSnap.exists || contactSnap.data().email !== signupEmail || contactSnap.data().emailNormalized !== signupEmail) {
    throw new Error('signupContacts document was not created correctly');
  }

  console.log('signup_smoke_ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
