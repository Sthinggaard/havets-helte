async function postSignup(payload) {
  return fetch('http://127.0.0.1:5003/api/submitSignup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function expectBadRequest(label, payload) {
  const response = await postSignup(payload);
  const body = await response.json().catch(() => ({}));

  if (response.status !== 400) {
    throw new Error(`${label}: expected HTTP 400, got ${response.status} with body ${JSON.stringify(body)}`);
  }

  if (!body.status || body.status === 'confirmed' || body.status === 'waitlist') {
    throw new Error(`${label}: expected validation error status, got ${JSON.stringify(body)}`);
  }
}

async function main() {
  await expectBadRequest('missing eventId', {
    slotId: 'slot-a',
    name: 'Invalid Test',
    email: 'invalid@example.com',
    adult: true,
    childMode: false,
    groupSize: 1,
    waitlistPreferred: false,
  });

  await expectBadRequest('missing slotId', {
    eventId: 'event-a',
    name: 'Invalid Test',
    email: 'invalid@example.com',
    adult: true,
    childMode: false,
    groupSize: 1,
    waitlistPreferred: false,
  });

  await expectBadRequest('invalid email', {
    eventId: 'event-a',
    slotId: 'slot-a',
    name: 'Invalid Test',
    email: 'not-an-email',
    adult: true,
    childMode: false,
    groupSize: 1,
    waitlistPreferred: false,
  });

  console.log('signup_validation_smoke_ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
