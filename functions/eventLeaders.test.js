const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function api(email = 'leader@havetshelte.dk') {
  const pages = [];
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
    pages,
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
