/**
 * Havets Helte — Forældrehelte notifikationer + selvbetjent afmelding
 *
 * OPSÆTNING:
 * 1. script.google.com → Nyt projekt → indsæt denne kode
 * 2. Ret de fire KONFIG-værdier herunder
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Kopiér web-app URL'en ind i index.html (APPS_SCRIPT_URL)
 *
 * Afmelding via cancel-link kræver at PROJECT_ID er sat korrekt.
 * Apps Script skal have Firestore-adgang: tilføj scope i appsscript.json:
 *   "oauthScopes": ["https://www.googleapis.com/auth/datastore",
 *                   "https://www.googleapis.com/auth/spreadsheets",
 *                   "https://www.googleapis.com/auth/script.external_request",
 *                   "https://www.googleapis.com/auth/gmail.send"]
 */

// ===== KONFIG =====
const NOTIFY_EMAIL  = 'laerke@havetshelte.dk';
const SHARED_SECRET = PropertiesService.getScriptProperties()
  .getProperty('PARENT_ACCESS_APPS_SCRIPT_SECRET') || '';
const PROJECT_ID    = 'havets-helte';
const SHEET_ID      = '';   // valgfri Google Sheet-log — tom = spring over
const FROM_NAME     = 'Havets Helte';
const SITE_URL      = 'https://havets-helte.web.app';

// ── Ny tilmelding (POST fra index.html) ────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SHARED_SECRET) return text('unauthorized');

    // Functions asks Apps Script to deliver the passwordless parent link.
    // The Firebase action code is generated server-side; Apps Script only
    // delivers it and never stores or logs the token.
    if (data.type === 'parentAccess') {
      if (!data.email || !data.magicLink) return text('invalid');
      MailApp.sendEmail({
        to: data.email, name: FROM_NAME,
        subject: 'Din adgang til Havets Helte',
        htmlBody:
          '<div style="font-family:Arial,sans-serif;color:#1a2535;line-height:1.6">' +
          '<p>Hej,</p>' +
          '<p>Brug linket nedenfor for at se og administrere dine tilmeldinger.</p>' +
          '<p><a href="' + esc(data.magicLink) + '" style="display:inline-block;background:#146e88;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">Se mine tilmeldinger</a></p>' +
          '<p style="color:#6b7a8d;font-size:12px">Linket er til engangsbrug og udløber snart. Hvis du ikke har bedt om denne mail, kan du ignorere den.</p>' +
          '</div>'
      });
      return text('ok');
    }

    // 1) Log til Google Sheet
    if (SHEET_ID) {
      try {
        SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow([
          new Date(), data.eventTitle || '', data.slotLabel || '',
          data.name || '', data.email || '',
          data.adult ? 'Ja' : 'Nej',
          data.groupSize || 1,
          data.price || ''
        ]);
      } catch (err) { console.error('Sheet-fejl: ' + err); }
    }

    // 2) Besked til lederen
    const groupNote = (data.groupSize || 1) > 1 ? ' (' + data.groupSize + ' deltagere)' : '';
    MailApp.sendEmail({
      to: NOTIFY_EMAIL, name: FROM_NAME,
      subject: 'Ny tilmelding: ' + (data.eventTitle || 'Opgave'),
      htmlBody:
        '<div style="font-family:Arial,sans-serif;color:#1a2535">' +
        '<p><strong>' + esc(data.name) + '</strong>' + esc(groupNote) +
        ' har meldt sig til <strong>' + esc(data.eventTitle) + '</strong>.</p>' +
        '<table style="border-collapse:collapse;font-size:14px">' +
        row('Vagt / opgave', data.slotLabel) +
        (data.price ? row('Pris', data.price + ' kr') : '') +
        row('Mail', data.email) +
        (data.location ? row('Sted', data.location) : '') +
        row('Over 18', data.adult ? 'Ja' : 'Nej') +
        '</table>' +
        '<p style="color:#6b7a8d;font-size:12px">Sendt automatisk fra Forældrehelte.</p>' +
        '</div>',
      attachments: calendarAttachments(data)
    });

    // 3) Bekræftelse til forælderen
    if (data.email && data.email.indexOf('@') > -1) {
      const cancelUrl = data.cancelToken
        ? ScriptApp.getService().getUrl() + '?cancel=' + encodeURIComponent(data.cancelToken)
        : null;
      const manageUrl = data.manageUrl ? String(data.manageUrl) : null;

      MailApp.sendEmail({
        to: data.email, name: FROM_NAME,
        subject: 'Tak for din tilmelding — ' + (data.eventTitle || ''),
        htmlBody:
          '<div style="font-family:Arial,sans-serif;color:#1a2535;line-height:1.6">' +
          '<p>Hej ' + esc(firstName(data.name)) + ',</p>' +
          '<p>Tak fordi du hjælper! Du er nu tilmeldt:</p>' +
          '<table style="border-collapse:collapse;font-size:14px;margin:8px 0">' +
          row('Opgave',         data.eventTitle) +
          row('Vagt / opgave',  data.slotLabel) +
          ((data.groupSize || 1) > 1 ? row('Antal deltagere', String(data.groupSize)) : '') +
          (data.price           ? row('Pris', data.price + ' kr')  : '') +
          (data.dateText        ? row('Dato', data.dateText)        : '') +
          (data.location        ? row('Sted', data.location)        : '') +
          '</table>' +
          (manageUrl
            ? '<p><a href="' + esc(manageUrl) + '" style="color:#146e88;font-weight:700">Se eller administrer dine tilmeldinger</a></p>'
            : cancelUrl
            ? '<p><a href="' + cancelUrl + '" style="color:#c0392b">Kan du alligevel ikke? Klik her for at afmelde dig.</a></p>'
            : '<p>Kan du alligevel ikke? Skriv til <a href="mailto:' + NOTIFY_EMAIL + '">' + NOTIFY_EMAIL + '</a>.</p>') +
          '<p>Mange spejderhilsner,<br>Havets Helte</p>' +
          '</div>',
        attachments: calendarAttachments(data)
      });
    }

    return text('ok');
  } catch (err) {
    console.error(err);
    return text('error: ' + err);
  }
}

// ── Afmelding via cancel-link (GET fra bekræftelsesmail) ──────────────────
function doGet(e) {
  const token = (e.parameter || {}).cancel;
  if (!token) return page('Ugyldigt link', 'Dette afmeldings-link er ikke gyldigt.');
  if (!PROJECT_ID || PROJECT_ID.indexOf('SKIFT') > -1) {
    return page('Ikke konfigureret', 'Kontakt os på <a href="mailto:' + NOTIFY_EMAIL + '">' + NOTIFY_EMAIL + '</a>.');
  }

  try {
    const oauthToken = ScriptApp.getOAuthToken();
    const fsBase = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents';
    const headers = { Authorization: 'Bearer ' + oauthToken, 'Content-Type': 'application/json' };

    // Find signupContacts med dette cancelToken
    const qResp = UrlFetchApp.fetch(fsBase + ':runQuery', {
      method: 'POST', headers,
      payload: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'signupContacts' }],
          where: { fieldFilter: {
            field: { fieldPath: 'cancelToken' }, op: 'EQUAL',
            value: { stringValue: token }
          }},
          limit: 1
        }
      }),
      muteHttpExceptions: true
    });

    const results = JSON.parse(qResp.getContentText());
    if (!results[0] || !results[0].document) {
      return page('Allerede afmeldt', 'Denne tilmelding er allerede fjernet. Tak fordi du gav besked!');
    }

    const docPath = results[0].document.name;          // …/signupContacts/{id}
    const docId   = docPath.split('/').pop();
    const fields  = results[0].document.fields || {};

    // Slet begge dokumenter (signup + signupContacts)
    const delHeaders = { Authorization: 'Bearer ' + oauthToken };
    UrlFetchApp.fetch('https://firestore.googleapis.com/v1/' + docPath,
      { method: 'DELETE', headers: delHeaders, muteHttpExceptions: true });
    UrlFetchApp.fetch(fsBase + '/signups/' + docId,
      { method: 'DELETE', headers: delHeaders, muteHttpExceptions: true });

    // Notificér leder om afmeldingen
    try {
      const name       = (fields.name       || {}).stringValue || '';
      const eventTitle = (fields.eventTitle  || {}).stringValue || '';
      MailApp.sendEmail({
        to: NOTIFY_EMAIL, name: FROM_NAME,
        subject: 'Afmelding: ' + (eventTitle || 'Opgave'),
        body: name + ' har afmeldt sig' + (eventTitle ? ' fra "' + eventTitle + '"' : '') + '.'
      });
    } catch (mailErr) { console.error('Afmeldings-mail fejlede: ' + mailErr); }

    return page('Afmeldingen er modtaget', 'Du er nu afmeldt. Tak fordi du gav os besked!');
  } catch (err) {
    console.error(err);
    return page('Noget gik galt',
      'Prøv igen eller skriv til <a href="mailto:' + NOTIFY_EMAIL + '">' + NOTIFY_EMAIL + '</a>.');
  }
}

// ── Hjælpefunktioner ───────────────────────────────────────────────────────
function page(title, msg) {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html lang="da"><head><title>' + title + '</title>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>body{font-family:Arial,sans-serif;max-width:480px;margin:60px auto;padding:20px;' +
    'text-align:center;color:#1a2535}h2{color:#0b1f3a}a{color:#0b1f3a}</style>' +
    '</head><body><p style="font-size:32px">⚓</p>' +
    '<h2>' + title + '</h2><p>' + msg + '</p>' +
    '<p style="margin-top:32px"><a href="' + SITE_URL + '">Tilbage til Havets Helte</a></p>' +
    '</body></html>'
  );
}

function text(s)          { return ContentService.createTextOutput(s); }
function row(label, val)  {
  return '<tr><td style="padding:3px 12px 3px 0;color:#6b7a8d">' + label +
         '</td><td style="padding:3px 0;font-weight:500">' + esc(val || '') + '</td></tr>';
}
function firstName(n) { return (n || '').split(' ')[0]; }
function calendarAttachments(data) {
  const ics = buildCalendarInvite(data);
  return ics ? [Utilities.newBlob(ics, 'text/calendar', 'havets-helte.ics')] : [];
}
function buildCalendarInvite(data) {
  const date = String(data.eventDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const times = String(data.timeText || '').match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  const compactDate = date.replace(/-/g, '');
  const start = compactDate + (times ? 'T' + times[1].replace(':', '') + '00' : '');
  const end = compactDate + (times ? 'T' + times[2].replace(':', '') + '00' : '');
  const dt = times
    ? 'DTSTART;TZID=Europe/Copenhagen:' + start + '\r\nDTEND;TZID=Europe/Copenhagen:' + end
    : 'DTSTART;VALUE=DATE:' + start + '\r\nDTEND;VALUE=DATE:' + compactDate;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Havets Helte//Forældrehelte//DA',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + Utilities.getUuid() + '@havets-helte',
    'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"),
    dt, 'SUMMARY:' + icsEscape(data.eventTitle || 'Havets Helte'),
    'DESCRIPTION:' + icsEscape(data.slotLabel || ''),
    'LOCATION:' + icsEscape(data.location || ''),
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n') + '\r\n';
}
function icsEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

// ── Test (kør i Apps Script-editoren) ─────────────────────────────────────
function testNotification() {
  doPost({ postData: { contents: JSON.stringify({
    secret:      SHARED_SECRET,
    eventTitle:  'TEST — Sankthans',
    slotLabel:   '16:00–18:00 · Drinksboden',
    name:        'Test Forælder',
    email:       NOTIFY_EMAIL,
    location:    'Sluseholmen',
    dateText:    'Tirsdag 23. juni',
    adult:       true,
    groupSize:   1,
    price:       0,
    cancelToken: 'test-cancel-token-abc123'
  })}});
}
