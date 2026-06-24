// One-time seed of the canonical sample events into the LIVE havets-helte
// Firestore `events` collection, so the admin forms (vagter/opgaver/
// arrangementer) have real data to edit. Mirrors the events in
// seedEmulator.mjs but targets the live project and authenticates as a real
// leader.
//
// Writing to live `events` requires auth (firestore.rules: write if auth != null),
// so credentials are read from env vars — this script never hard-codes them:
//
//   cd apps/www
//   SEED_EMAIL='you@example.dk' SEED_PASSWORD='your-password' node scripts/seedLive.mjs
//
// Idempotent: it skips any event whose title already exists, so it is safe to
// run repeatedly.
import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, getFirestore, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const LIVE_CONFIG = {
  apiKey: 'AIzaSyBK5bi8bQ4-gFFgmzkESqumeTlbqeIWFbM',
  authDomain: 'havets-helte.firebaseapp.com',
  projectId: 'havets-helte',
  storageBucket: 'havets-helte.firebasestorage.app',
};

function log(message) {
  console.log(`[seed:live] ${message}`);
}

// Full legacy slot shape, with sensible defaults so the new reader and the
// legacy admin both stay happy.
function slot(partial) {
  const requiresAdult = partial.requiresAdult ?? false;
  const groupSize = partial.groupSize ?? partial.groupMax ?? 1;
  return {
    id: partial.id,
    label: partial.label,
    role: partial.role ?? '',
    sublabel: partial.sublabel ?? '',
    capacity: partial.capacity ?? 1,
    kind: partial.kind ?? 'volunteer',
    price: partial.price ?? 0,
    groupSize,
    groupMin: groupSize,
    groupMax: groupSize,
    minAge: requiresAdult ? 18 : 0,
    requiresAdult,
  };
}

function seedEvents() {
  return [
    {
      title: 'Sankt Hans på Sluseholmen',
      description:
        'Vi bygger og tænder bålet, sælger drikkevarer og står for skumfidus-stationen. Alt overskud går til spejdergruppen.',
      dateText: 'Tirsdag 23. juni · 16:00–22:00',
      location: 'Sluseholmen, ved trappen i bunden af Thad Jones Vej',
      type: 'timed',
      active: true,
      paymentUrl: '',
      cancelDeadlineDays: 0,
      imageUrl: '',
      slots: [
        slot({ id: 's1', label: 'Drinksboden', sublabel: '16:00–18:00', capacity: 3, requiresAdult: true }),
        slot({ id: 's2', label: 'Drinksboden', sublabel: '18:00–20:00', capacity: 3, requiresAdult: true }),
        slot({ id: 's3', label: 'Drinksboden', sublabel: '20:00–22:00', capacity: 3, requiresAdult: true }),
        slot({ id: 's4', label: 'Skumfidus-station', sublabel: '16:00–18:00', capacity: 3, requiresAdult: false }),
        slot({ id: 's5', label: 'Skumfidus-station', sublabel: '18:00–20:00', capacity: 3, requiresAdult: false }),
        slot({ id: 's6', label: 'Skumfidus-station', sublabel: '20:00–22:00', capacity: 3, requiresAdult: false }),
      ],
    },
    {
      title: 'Lejrtur — hjælp til forberedelse',
      description: '',
      dateText: 'Løbende frem til 1. august',
      location: '',
      type: 'task',
      active: true,
      paymentUrl: '',
      cancelDeadlineDays: 0,
      imageUrl: '',
      slots: [
        slot({ id: 't1', label: 'Transport af udstyr', capacity: 2 }),
        slot({ id: 't2', label: 'Indkøb af madvarer', capacity: 1 }),
        slot({ id: 't3', label: 'Hjælp til pakning', capacity: 3 }),
      ],
    },
    {
      title: 'Fællesspisning — forældre velkommen',
      description: 'Kom og spis med os efter mødet. Tilmeld dig så vi ved hvor mange vi er.',
      dateText: 'Mandag 24. august · kl. 18:00',
      location: 'Klubhuset',
      type: 'task',
      active: true,
      paymentUrl: '',
      cancelDeadlineDays: 0,
      imageUrl: '',
      slots: [
        slot({ id: 'a1', label: 'Deltager', capacity: 0, kind: 'attend' }),
        slot({ id: 'a2', label: 'Medbringer dessert', capacity: 5, kind: 'attend' }),
      ],
    },
    {
      title: 'Nathejk 2026',
      description:
        "DDS's adventurespejderløb. Tilmeld din patrulje og betal samlet. Lederne sørger for tilmelding på nathejk.dk.",
      dateText: 'Lørdag 12. september',
      location: '',
      type: 'event',
      active: true,
      paymentUrl: 'https://mobilepay.dk/box/TESTLINK',
      cancelDeadlineDays: 0,
      imageUrl: '',
      slots: [
        slot({ id: 'n1', label: 'Patruljeplads', sublabel: '5 spejdere pr. patrulje', capacity: 25, kind: 'paid', price: 200, groupSize: 5 }),
      ],
    },
  ];
}

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    log('Mangler SEED_EMAIL / SEED_PASSWORD. Kør fx:');
    log("  SEED_EMAIL='you@example.dk' SEED_PASSWORD='…' node scripts/seedLive.mjs");
    process.exitCode = 1;
    return;
  }

  const app = initializeApp(LIVE_CONFIG);
  const db = getFirestore(app);
  const auth = getAuth(app);

  log(`Logger ind som ${email} …`);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    log(`Login fejlede: ${error.code || error.message}`);
    process.exitCode = 1;
    return;
  }
  log('✓ Logget ind');

  const existingSnap = await getDocs(collection(db, 'events'));
  const existingTitles = new Set(existingSnap.docs.map(d => String(d.data().title || '').trim()));
  log(`${existingSnap.size} eksisterende events i live Firestore.`);

  let created = 0;
  for (const event of seedEvents()) {
    if (existingTitles.has(event.title)) {
      log(`→ Springer over (findes allerede): ${event.title}`);
      continue;
    }
    const ref = await addDoc(collection(db, 'events'), {
      ...event,
      createdBy: auth.currentUser?.uid || 'seed',
      created: serverTimestamp(),
      updated: serverTimestamp(),
    });
    created += 1;
    log(`✓ Oprettet ${event.type}: ${event.title} (${ref.id})`);
  }

  log(`Færdig. ${created} nye events oprettet.`);
  process.exit(0);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
