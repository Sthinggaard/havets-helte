// Seeds the local Firebase emulators with the same sample data as
// public/seed.html, but idempotently and from the command line so it can run
// automatically as a `predev` step. Safe to run repeatedly: it checks for
// existing seed data first and skips entirely if the emulator already has it.
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  initializeFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { getGroupNameById, getTeamId, getTeamLabel } from '../../../public/groups.js';

const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8081;
const AUTH_URL = 'http://127.0.0.1:9097';
const SUBMIT_SIGNUP_URL = 'http://127.0.0.1:5003/api/submitSignup';

function log(message) {
  console.log(`[seed] ${message}`);
}

async function createSignupViaApi(payload) {
  try {
    const response = await fetch(SUBMIT_SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      log('Signup API svarede med fejl, springer testtilmeldinger over.');
      return null;
    }
    return await response.json().catch(() => ({}));
  } catch {
    log('Signup API ikke tilgængelig (functions-emulator kører ikke), springer testtilmeldinger over.');
    return null;
  }
}

async function main() {
  const app = initializeApp({ projectId: 'havets-helte', apiKey: 'demo', authDomain: 'havets-helte.firebaseapp.com' });
  const db = initializeFirestore(app, { experimentalForceLongPolling: true });
  const auth = getAuth(app);

  try {
    connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
    connectAuthEmulator(auth, AUTH_URL, { disableWarnings: true });
  } catch (error) {
    log(`Kunne ikke konfigurere emulator-forbindelse: ${error.message}`);
    return;
  }

  log('Opretter sthinggaard@havetshelte.dk …');
  try {
    await createUserWithEmailAndPassword(auth, 'sthinggaard@havetshelte.dk', 'test1234');
    log('✓ Leder oprettet (sthinggaard@havetshelte.dk / test1234)');
  } catch {
    log('→ Leder eksisterer allerede (OK)');
  }
  await signInWithEmailAndPassword(auth, 'sthinggaard@havetshelte.dk', 'test1234');

  const existing = await getDocs(query(collection(db, 'events'), limit(1))).catch(error => {
    log(`Emulatoren svarer ikke (er den startet?): ${error.message}`);
    return null;
  });
  if (existing === null) return;
  if (!existing.empty) {
    log('Emulator-data findes allerede, springer seed over.');
    return;
  }

  log('Opretter Sankt Hans event…');
  const now = serverTimestamp();
  const slots = [
    { id: 's1', label: 'Drinksboden', sublabel: '16:00–18:00', capacity: 3, requiresAdult: true, role: 'Ansvarlig' },
    { id: 's2', label: 'Drinksboden', sublabel: '18:00–20:00', capacity: 3, requiresAdult: true, role: 'Vagt' },
    { id: 's3', label: 'Drinksboden', sublabel: '20:00–22:00', capacity: 3, requiresAdult: true, role: 'Koordinator' },
    { id: 's4', label: 'Skumfidus-station', sublabel: '16:00–18:00', capacity: 3, requiresAdult: false, role: 'Hjælper' },
    { id: 's5', label: 'Skumfidus-station', sublabel: '18:00–20:00', capacity: 3, requiresAdult: false },
    { id: 's6', label: 'Skumfidus-station', sublabel: '20:00–22:00', capacity: 3, requiresAdult: false },
  ];
  const evRef = await addDoc(collection(db, 'events'), {
    title: 'Sankt Hans på Sluseholmen',
    description: 'Vi bygger og tænder bålet, sælger drikkevarer og står for skumfidus-stationen. Alt overskud går til spejdergruppen.',
    dateText: 'Tirsdag 23. juni · 16:00–22:00',
    location: 'Sluseholmen, ved trappen i bunden af Thad Jones Vej',
    type: 'timed',
    active: true,
    slots,
    createdBy: 'seed',
    created: now,
  });
  log(`✓ Event oprettet: ${evRef.id}`);

  log('Opretter opgave-event (test)…');
  await addDoc(collection(db, 'events'), {
    title: 'Lejrtur — hjælp til forberedelse',
    dateText: 'Løbende frem til 1. august',
    location: '',
    type: 'task',
    active: true,
    slots: [
      { id: 't1', label: 'Transport af udstyr', sublabel: '', capacity: 2, requiresAdult: false },
      { id: 't2', label: 'Indkøb af madvarer', sublabel: '', capacity: 1, requiresAdult: false },
      { id: 't3', label: 'Hjælp til pakning', sublabel: '', capacity: 3, requiresAdult: false },
    ],
    createdBy: 'seed',
    created: now,
  });
  log('✓ Opgave-event oprettet');

  log('Opretter test-tilmeldinger…');
  const testSignups = [
    { slotId: 's1', name: 'Søren Jensen', email: 'soren@test.dk', adult: true },
    { slotId: 's1', name: 'Anne Hansen', email: 'anne@test.dk', adult: true },
    { slotId: 's2', name: 'Peter Madsen', email: 'peter@test.dk', adult: true },
    { slotId: 's4', name: 'Anna Christensen', email: 'anna@test.dk', adult: false },
  ];
  for (const s of testSignups) {
    await createSignupViaApi({
      eventId: evRef.id,
      slotId: s.slotId,
      name: s.name,
      email: s.email,
      adult: s.adult,
      childMode: false,
      groupSize: 1,
      waitlistPreferred: false,
    });
  }

  log('Opretter fællesspisning-event (attend-slots)…');
  await addDoc(collection(db, 'events'), {
    title: 'Fællesspisning — forældre velkommen',
    description: 'Kom og spis med os efter mødet. Tilmeld dig så vi ved hvor mange vi er.',
    dateText: 'Mandag 24. august · kl. 18:00',
    location: 'Klubhuset',
    type: 'task',
    active: true,
    slots: [
      { id: 'a1', label: 'Deltager', sublabel: '', capacity: 0, kind: 'attend', price: 0, groupMin: 1, groupMax: 1, requiresAdult: false },
      { id: 'a2', label: 'Medbringer dessert', sublabel: '', capacity: 5, kind: 'attend', price: 0, groupMin: 1, groupMax: 1, requiresAdult: false },
    ],
    createdBy: 'seed',
    created: now,
  });
  log('✓ Fællesspisning oprettet');

  log('Opretter Nathejk-event (paid + gruppe-slots)…');
  await addDoc(collection(db, 'events'), {
    title: 'Nathejk 2026',
    description: 'DDS\'s adventurespejderløb. Tilmeld din patrulje og betal samlet. Lederne sørger for tilmelding på nathejk.dk.',
    dateText: 'Lørdag 12. september',
    location: '',
    type: 'event',
    active: true,
    paymentUrl: 'https://mobilepay.dk/box/TESTLINK',
    slots: [
      { id: 'n1', label: 'Patruljeplads', sublabel: '5 spejdere pr. patrulje', capacity: 25, kind: 'paid', price: 200, groupMin: 5, groupMax: 5, requiresAdult: false },
    ],
    createdBy: 'seed',
    created: now,
  });
  log('✓ Nathejk oprettet');

  async function ensureTeamDoc(groupId, day) {
    await setDoc(doc(db, 'groupTeams', getTeamId(groupId, day)), {
      groupId,
      day,
      label: getTeamLabel(day),
      active: true,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    }, { merge: true });
  }

  async function seedMembers(groupId, members) {
    for (const m of members) {
      await ensureTeamDoc(groupId, m.day);
      await addDoc(collection(db, 'members'), {
        ...m,
        groupId,
        groupName: getGroupNameById(groupId),
        gren: getGroupNameById(groupId),
        teamId: getTeamId(groupId, m.day),
        teamLabel: getTeamLabel(m.day),
        active: true,
        created: now,
      });
    }
    log(`✓ Testmedlemmer oprettet (${groupId}: ${members.length})`);
  }

  await seedMembers('landkrabber', [
    { name: 'Magnus Hansen', fødselsdato: '2013-03-12', startdato: '2024-04-30', foto: true, day: 'mandag' },
    { name: 'Anna Larsen', fødselsdato: '2013-09-05', startdato: '2024-05-01', foto: true, day: 'tirsdag' },
    { name: 'Peter Jensen', fødselsdato: '2014-01-22', startdato: '2024-05-01', foto: false, day: 'mandag' },
    { name: 'Sofie Nielsen', fødselsdato: '2013-11-08', startdato: '2025-05-05', foto: true, day: 'tirsdag' },
    { name: 'Emil Christensen', fødselsdato: '2014-06-17', startdato: '2025-05-05', foto: false, day: 'mandag' },
    { name: 'Laura Pedersen', fødselsdato: '2013-07-30', startdato: '2025-06-09', foto: false, day: 'tirsdag' },
    { name: 'Oliver Andersen', fødselsdato: '2014-02-14', startdato: '2025-08-18', foto: false, day: 'mandag' },
    { name: 'Emma Thomsen', fødselsdato: '2013-12-03', startdato: '2025-09-09', foto: false, day: 'tirsdag' },
    { name: 'Lucas Møller', fødselsdato: '2014-04-25', startdato: '2025-09-09', foto: false, day: 'mandag' },
    { name: 'Ida Poulsen', fødselsdato: '2013-08-19', startdato: '2025-09-09', foto: false, day: 'tirsdag' },
  ]);

  await seedMembers('trop', [
    { name: 'Alma Sørensen', fødselsdato: '2011-03-12', startdato: '2024-08-15', foto: false, day: 'onsdag' },
    { name: 'Mikkel Ravn', fødselsdato: '2011-09-04', startdato: '2024-08-15', foto: false, day: 'torsdag' },
    { name: 'Signe Holm', fødselsdato: '2010-11-27', startdato: '2025-02-03', foto: false, day: 'onsdag' },
    { name: 'Victor Jørgensen', fødselsdato: '2011-05-18', startdato: '2025-02-03', foto: false, day: 'torsdag' },
  ]);

  await seedMembers('junior', [
    { name: 'Mathilde Hansen', fødselsdato: '2016-05-10', startdato: '2024-12-08', foto: false, day: 'mandag' },
    { name: 'Noah Larsen', fødselsdato: '2016-08-22', startdato: '2024-12-08', foto: false, day: 'tirsdag' },
    { name: 'Freja Jensen', fødselsdato: '2017-02-14', startdato: '2025-01-15', foto: false, day: 'mandag' },
    { name: 'William Nielsen', fødselsdato: '2016-11-30', startdato: '2025-01-15', foto: false, day: 'tirsdag' },
  ]);

  log('Opretter testmøder…');
  const meetings = [
    { date: '2026-06-10', groupId: 'landkrabber', groupName: getGroupNameById('landkrabber'), gren: getGroupNameById('landkrabber'), title: '' },
    { date: '2026-06-16', groupId: 'landkrabber', groupName: getGroupNameById('landkrabber'), gren: getGroupNameById('landkrabber'), title: 'Sommermøde' },
    { date: '2026-06-23', groupId: 'landkrabber', groupName: getGroupNameById('landkrabber'), gren: getGroupNameById('landkrabber'), title: '' },
    { date: '2026-06-16', groupId: 'junior', groupName: getGroupNameById('junior'), gren: getGroupNameById('junior'), title: '' },
  ];
  for (const m of meetings) {
    await addDoc(collection(db, 'meetings'), { ...m, created: now, createdBy: 'seed' });
  }
  log('✓ Testmøder oprettet');

  log('✅ Færdig!');
  process.exit(0);
}

main().then(() => {
  // Firebase keeps connections open even when existing data makes main return early.
  process.exit(0);
}).catch(error => {
  log(`Seed sprunget over: ${error.message}`);
  process.exit(0);
});
