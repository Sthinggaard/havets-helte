const admin = require('../functions/node_modules/firebase-admin');
const { initializeApp } = require('../apps/www/node_modules/firebase/app');
const {
  getFirestore,
  connectFirestoreEmulator,
  getDoc,
  doc,
} = require('../apps/www/node_modules/firebase/firestore');

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8081';
const projectId = 'havets-helte';

admin.initializeApp({ projectId });
const adminDb = admin.firestore();
adminDb.settings({ ignoreUndefinedProperties: true });

const clientApp = initializeApp({ projectId, apiKey: 'demo' }, 'smoke-signup-client');
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, '127.0.0.1', 8081);

async function main() {
  const eventId = `smoke-${Date.now()}`;
  const signupName = 'Smoke Test Leader';
  const signupEmail = 'smoke@havetshelte.dk';

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
        eligibleGroups: [
          { id: 'team:ulv:Mandagshold', label: 'Ulv · Mandagshold', branchId: 'ulv', branchLabel: 'Ulv', team: 'Mandagshold' },
        ],
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
  if (response.ok) {
    throw new Error('signup without an allowed group was accepted');
  }

  const allowedResponse = await fetch('http://127.0.0.1:5004/havets-helte/europe-west1/submitSignup', {
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
      audienceGroupId: 'team:ulv:Mandagshold',
      waitlistPreferred: false,
    }),
  });
  const result = await allowedResponse.json();
  if (!allowedResponse.ok || result.status !== 'confirmed') {
    throw new Error(`trusted signup failed: ${JSON.stringify(result)}`);
  }
  const signupId = result.signupId;

  const signupSnap = await getDoc(doc(clientDb, 'signups', signupId));
  if (!signupSnap.exists()) {
    throw new Error('signup document was not created');
  }

  const signup = signupSnap.data() || {};
  if (signup.eventId !== eventId || signup.slotId !== 'slot-a' || signup.name !== signupName
    || signup.audienceGroupId !== 'team:ulv:Mandagshold' || signup.audienceGroupLabel !== 'Ulv · Mandagshold') {
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
