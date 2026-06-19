const admin = require('../functions/node_modules/firebase-admin');

const projectId = 'havets-helte';

admin.initializeApp({ projectId });
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  const eventId = `smoke-${Date.now()}`;
  const signupName = 'Smoke Test Parent';
  const signupEmail = 'smoke@example.com';

  await db.collection('events').doc(eventId).set({
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

  const response = await fetch('http://127.0.0.1:5003/api/submitSignup', {
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

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Expected 200 from submitSignup, got ${response.status}: ${body}`);
  }

  const result = await response.json();
  if (!result.signupId) {
    throw new Error('submitSignup did not return signupId');
  }

  const signupSnap = await db.collection('signups').doc(result.signupId).get();
  if (!signupSnap.exists) {
    throw new Error('signup document was not created');
  }

  const signup = signupSnap.data() || {};
  if (signup.eventId !== eventId || signup.slotId !== 'slot-a' || signup.name !== signupName) {
    throw new Error('signup document content does not match the submitted payload');
  }

  console.log('signup_smoke_ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
