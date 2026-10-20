const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function api(email = 'leader@havetshelte.dk') {
  const pages = [];
  const updates = [];
  const eventUpdates = [];
  const state = { failPropagation: false };
  const eventRecords = [
    { id: 'first', responsibleLeaders: [{ id: 'laerke', name: 'Old name' }, { id: 'manual:guest', name: 'Old name' }] },
    { id: 'second', responsibleLeaders: [{ id: 'laerke', name: 'Another old name' }, { id: 'other', name: 'Other leader' }] },
    { id: 'unrelated', responsibleLeaders: [{ id: 'other', name: 'Other leader' }] },
    { id: 'legacy' },
  ];
  const snapshot = event => ({ exists: true, ref: { id: event.id }, get: key => event[key] });
  const db = {
    collection: () => ({ doc() {}, get: async () => ({ docs: eventRecords.map(snapshot) }) }),
    runTransaction: async callback => {
      if (state.failPropagation) throw new Error('Firestore unavailable');
      return callback({
        getAll: async (...refs) => refs.map(ref => snapshot(eventRecords.find(event => event.id === ref.id))),
        update: (ref, fields) => {
          eventUpdates.push({ id: ref.id, fields });
          Object.assign(eventRecords.find(event => event.id === ref.id), fields);
        },
      });
    },
  };
  const users = [
    { uid: 'parent', email: 'parent@example.com', displayName: 'Forælder' },
    { uid: 'disabled', email: 'disabled@havetshelte.dk', disabled: true },
    { uid: 'laerke', email: 'Laerke@havetshelte.dk', displayName: ' Lærke ' },
  ];
  const context = {
    exports: {},
    require: name => {
      if (name === 'firebase-admin') return {
        initializeApp() {},
        firestore: () => db,
        auth: () => ({
          verifyIdToken: async () => ({ uid: 'caller', email }),
          listUsers: async (limit, token) => {
            pages.push(token);
            assert.equal(limit, 1000);
            return token ? { users: [{ uid: 'anna', email: 'anna@havetshelte.dk' }] } : { users, pageToken: 'next' };
          },
          getUser: async id => {
            const user = users.find(item => item.uid === id);
            if (!user) throw Object.assign(new Error('Missing user'), { code: 'auth/user-not-found' });
            return user;
          },
          updateUser: async (id, fields) => {
            updates.push({ id, fields });
            Object.assign(users.find(item => item.uid === id), fields);
          },
        }),
      };
      if (name === 'firebase-admin/firestore') return {};
      if (name === 'firebase-functions/logger') return { error() {} };
      if (name === 'firebase-functions/v2/https') return { onRequest: (options, handler) => handler };
      if (name === 'firebase-functions/v2/firestore') return { onDocumentWritten() {} };
      if (name === 'firebase-functions/params') return { defineSecret() {}, defineString: () => ({ value: () => 'https://havets-helte.web.app' }) };
      return require(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/index.js`, 'utf8'), context);
  return {
    pages, updates, eventUpdates, eventRecords, state,
    async save(id, name, authorized = true) {
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; }, send() {} };
      await context.exports.updateEventLeaderName({ method: 'POST', body: { id, name }, get: () => authorized ? 'Bearer test' : '' }, res);
      return res;
    },
    async get({ authorized = true, method = 'GET' } = {}) {
      const res = { status(code) { this.code = code; return this; }, set() {}, json(body) { this.body = body; }, send() {} };
      await context.exports.getEventLeaders({ method, get: () => authorized ? 'Bearer test' : '' }, res);
      return res;
    },
  };
}

test('leader directory rejects anonymous and parent callers before listing accounts', async () => {
  const anonymous = api();
  assert.equal((await anonymous.get({ authorized: false })).code, 401);
  assert.equal(anonymous.pages.length, 0);
  const parent = api('parent@example.com');
  assert.equal((await parent.get()).code, 403);
  assert.equal(parent.pages.length, 0);
});

test('leader directory handles pagination and only returns enabled leader identities', async () => {
  const leaders = api();
  const response = await leaders.get();
  assert.equal(response.code, 200);
  assert.equal(leaders.pages.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body.leaders)), [
    { id: 'anna', name: 'anna', email: 'anna@havetshelte.dk' },
    { id: 'laerke', name: 'Lærke', email: 'laerke@havetshelte.dk' },
  ]);
});

test('leader directory rejects writes', async () => {
  const leaders = api();
  assert.equal((await leaders.get({ method: 'POST' })).code, 405);
  assert.equal(leaders.pages.length, 0);
});

test('saving a leader name makes it available on subsequent directory reads', async () => {
  const leaders = api();
  const response = await leaders.save('laerke', '  Lærke   Hansen  ');
  assert.equal(response.code, 200);
  assert.equal(response.body.leader.name, 'Lærke Hansen');
  assert.deepEqual(JSON.parse(JSON.stringify(leaders.updates)), [{ id: 'laerke', fields: { displayName: 'Lærke Hansen' } }]);
  const reloaded = await leaders.get();
  assert.equal(reloaded.body.leaders.find(item => item.id === 'laerke').name, 'Lærke Hansen');
  await leaders.save('laerke', 'Lærke Hansen');
  assert.equal(leaders.updates.length, 1, 'unchanged names do not cause another write');
  assert.equal(leaders.eventUpdates.length, 2, 'unchanged event names do not cause another write');
});

test('renaming a leader updates all event snapshots by account ID, preserving other leaders', async () => {
  const leaders = api();
  assert.equal((await leaders.save('laerke', 'Lærke Hansen')).code, 200);
  assert.equal(leaders.eventRecords[0].responsibleLeaders[0].name, 'Lærke Hansen');
  assert.equal(leaders.eventRecords[1].responsibleLeaders[0].name, 'Lærke Hansen');
  assert.equal(leaders.eventRecords[0].responsibleLeaders[1].name, 'Old name', 'manual leaders are not linked by name');
  assert.equal(leaders.eventRecords[1].responsibleLeaders[1].name, 'Other leader');
  assert.deepEqual(leaders.eventUpdates.map(event => event.id), ['first', 'second']);
});

test('retry repairs event names even when the account name was saved before a propagation failure', async () => {
  const leaders = api();
  leaders.state.failPropagation = true;
  assert.equal((await leaders.save('laerke', 'Lærke Hansen')).code, 500);
  assert.equal(leaders.updates.length, 1);
  assert.equal(leaders.eventUpdates.length, 0);
  leaders.state.failPropagation = false;
  assert.equal((await leaders.save('laerke', 'Lærke Hansen')).code, 200);
  assert.equal(leaders.updates.length, 1);
  assert.equal(leaders.eventUpdates.length, 2);
});

test('name changes require leader authentication and an enabled leader target', async () => {
  const anonymous = api();
  assert.equal((await anonymous.save('laerke', 'Name', false)).code, 401);
  assert.equal(anonymous.updates.length, 0);
  const parent = api('parent@example.com');
  assert.equal((await parent.save('laerke', 'Name')).code, 403);
  assert.equal(parent.updates.length, 0);
  const leaders = api();
  for (const id of ['parent', 'disabled', 'missing', 'manual:external']) {
    assert.equal((await leaders.save(id, 'Name')).code, 404);
  }
  assert.equal(leaders.updates.length, 0);
});

test('invalid profile names do not cause account writes', async () => {
  const leaders = api();
  for (const name of ['', '  ', null, {}, 'a'.repeat(121)]) {
    assert.equal((await leaders.save('laerke', name)).code, 400);
  }
  assert.equal(leaders.updates.length, 0);
});
