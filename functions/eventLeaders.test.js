const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function api(email = 'leader@havetshelte.dk') {
  const pages = [];
  const updates = [];
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
        firestore: () => ({ collection: () => ({ doc() {} }) }),
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
      if (name === 'firebase-functions/params') return { defineSecret() {}, defineString() {} };
      return require(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/index.js`, 'utf8'), context);
  return {
    pages, updates,
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
