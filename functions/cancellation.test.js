const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function cancellationApi({ owner = 'parent@example.com', exists = true, mailFails = false, waitlist = false } = {}) {
  const changes = [];
  const mail = [];
  let committed = false;
  const record = data => ({ exists, data: () => data, get: key => data[key] });
  const signup = record({ eventId: 'event', slotId: 'shift', name: 'Forælder', groupSize: 2, waitlist });
  const contact = record({ email: owner, name: 'Forælder' });
  const event = record({ title: 'Juletræssalget', dateText: '28. november', slots: [{ id: 'shift', label: 'Juletræsvagt', sublabel: '10:00–14:00', date: '2026-12-05' }] });
  const db = {
    collection: name => ({
      doc: id => ({ path: `${name}/${id}` }),
      where() { return this; },
    }),
    runTransaction: async callback => {
      const result = await callback({
        get: async ref => {
          if (ref.path === 'signupContacts/signup') return contact;
          if (ref.path === 'signups/signup') return signup;
          if (ref.path === 'events/event') return event;
          if (!ref.path) return { docs: [signup] };
          return record({ confirmed: 2 });
        },
        set: (ref, data) => changes.push({ path: ref.path, data }),
        delete: ref => changes.push({ deleted: ref.path }),
      });
      committed = true;
      return result;
    },
  };
  const admin = {
    initializeApp() {},
    firestore: () => db,
    auth: () => ({ verifyIdToken: async () => ({ uid: 'parent', email: 'parent@example.com' }) }),
  };
  const context = {
    exports: {}, URL, AbortSignal,
    require: name => {
      if (name === 'firebase-admin') return admin;
      if (name === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => 'now' } };
      if (name === 'firebase-functions/logger') return { info() {}, error() {} };
      if (name === 'firebase-functions/v2/https') return { onRequest: (options, callback) => callback };
      if (name === 'firebase-functions/v2/firestore') return { onDocumentWritten: () => () => {} };
      if (name === 'firebase-functions/params') return {
        defineSecret: () => ({ value: () => 'test-secret' }),
        defineString: (key, options) => ({ value: () => options.default }),
      };
      return require(name);
    },
    fetch: async (url, options) => {
      assert.equal(committed, true, 'mail must be sent after the transaction commits');
      mail.push(JSON.parse(options.body));
      if (mailFails) throw new Error('mail unavailable');
      return { ok: true, text: async () => 'ok' };
    },
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/index.js`, 'utf8'), context);
  return {
    changes, mail,
    async cancel(reason, authenticated = true) {
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
      await context.exports.cancelParentSignup({
        method: 'POST', body: { signupId: 'signup', reason },
        get: () => authenticated ? 'Bearer parent-token' : '',
      }, res);
      return res;
    },
  };
}

test('cancellation requires a bounded, nonblank string before any write or email', async () => {
  for (const reason of [undefined, null, '', ' \n ', {}, 123, 'a'.repeat(1001)]) {
    const api = cancellationApi();
    const response = await api.cancel(reason);
    assert.equal(response.code, 400);
    assert.equal(response.body.status, 'invalid_reason');
    assert.equal(api.changes.length, 0);
    assert.equal(api.mail.length, 0);
  }
});

test('cancellation preserves authentication and ownership checks', async () => {
  const anonymous = cancellationApi();
  assert.equal((await anonymous.cancel('Sygdom', false)).code, 401);
  for (const options of [{ owner: 'other@example.com' }, { exists: false }]) {
    const api = cancellationApi(options);
    assert.equal((await api.cancel('Sygdom')).code, 404);
    assert.equal(api.changes.length, 0);
    assert.equal(api.mail.length, 0);
  }
});

test('successful cancellation releases capacity and sends the reason and actual shift date', async () => {
  const api = cancellationApi();
  const response = await api.cancel('  Vi er blevet syge.\nBeklager!  ');
  assert.equal(response.code, 200);
  assert.equal(response.body.notificationSent, true);
  assert.equal(api.changes[0].data.confirmed, 0);
  assert.deepEqual(api.changes.slice(1), [{ deleted: 'signups/signup' }, { deleted: 'signupContacts/signup' }]);
  assert.equal(api.mail.length, 1);
  assert.equal(api.mail[0].type, 'cancellation');
  assert.equal(api.mail[0].reason, 'Vi er blevet syge.\nBeklager!');
  assert.equal(api.mail[0].dateText, 'lørdag den 5. december 2026');
  assert.equal(api.mail[0].slotLabel, 'Juletræsvagt · 10:00–14:00');
});

test('mail failure reports the completed cancellation separately', async () => {
  const api = cancellationApi({ mailFails: true });
  const response = await api.cancel('a'.repeat(1000));
  assert.equal(response.code, 200);
  assert.equal(response.body.status, 'cancelled');
  assert.equal(response.body.notificationSent, false);
  assert.equal(api.changes.length, 3);
});

test('Apps Script sends only a cancellation notification and escapes user text', () => {
  const sent = [];
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-secret' }) },
    MailApp: { sendEmail: data => sent.push(data) },
    ContentService: { createTextOutput: value => value },
    HtmlService: { createHtmlOutput: value => value },
    console,
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../Code.gs`, 'utf8'), context);
  const post = data => context.doPost({ postData: { contents: JSON.stringify(data) } });
  const data = { secret: 'test-secret', type: 'cancellation', name: '<Test>', eventTitle: 'Juletræssalget', slotLabel: 'Juletræsvagt · 10:00–14:00', dateText: '5. december 2026', reason: '<script>alert(1)</script>\nSygdom' };
  assert.equal(post({ ...data, secret: 'wrong' }), 'unauthorized');
  assert.equal(post({ ...data, reason: '   ' }), 'invalid');
  assert.equal(sent.length, 0);
  assert.equal(post(data), 'ok');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'laerke@havetshelte.dk');
  assert.match(sent[0].subject, /^Afmelding:/);
  assert.match(sent[0].htmlBody, /&lt;script&gt;/);
  assert.doesNotMatch(sent[0].htmlBody, /<script>/);
  assert.match(sent[0].htmlBody, /5. december 2026/);
  assert.match(context.doGet({ parameter: { cancel: 'old-token' } }), /\/mine/);
});
