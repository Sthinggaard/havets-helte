/**
 * Havets Helte — Forældrehelte notifikationer
 * Gratis backend via Google Apps Script (sender mail gennem jeres Workspace-Gmail).
 *
 * OPSÆTNING (se trin-for-trin i chatten):
 * 1. script.google.com -> Nyt projekt -> indsæt denne kode
 * 2. Ret de tre KONFIG-værdier herunder
 * 3. Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Kopiér web-app URL'en ind i index.html (APPS_SCRIPT_URL)
 */

// ===== KONFIG =====
const NOTIFY_EMAIL = 'laerke@havetshelte.dk';   // lederen der får besked om nye tilmeldinger
const SHARED_SECRET = 'SKIFT-MIG-til-en-laang-tilfaeldig-streng'; // skal matche index.html
const SHEET_ID = '';   // valgfri: ID på et Google Sheet til log (tom = spring over)
const FROM_NAME = 'Havets Helte';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // simpel beskyttelse mod tilfældig misbrug
    if (data.secret !== SHARED_SECRET) {
      return ContentService.createTextOutput('unauthorized');
    }

    // 1) Log til Google Sheet (hvis SHEET_ID er sat)
    if (SHEET_ID) {
      try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
        sheet.appendRow([
          new Date(),
          data.eventTitle || '',
          data.slotLabel || '',
          data.name || '',
          data.email || '',
          data.adult ? 'Ja' : 'Nej'
        ]);
      } catch (sheetErr) {
        // log-fejl må ikke stoppe mailen
        console.error('Sheet-fejl: ' + sheetErr);
      }
    }

    // 2) Besked til lederen
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      name: FROM_NAME,
      subject: 'Ny tilmelding: ' + (data.eventTitle || 'Opgave'),
      htmlBody:
        '<div style="font-family:Arial,sans-serif;color:#1a2535">' +
        '<p><strong>' + escapeHtml(data.name) + '</strong> har meldt sig til ' +
        '<strong>' + escapeHtml(data.eventTitle) + '</strong>.</p>' +
        '<table style="border-collapse:collapse;font-size:14px">' +
        row('Vagt / opgave', data.slotLabel) +
        row('Mail', data.email) +
        (data.location ? row('Sted', data.location) : '') +
        row('Over 18', data.adult ? 'Ja' : 'Nej') +
        '</table>' +
        '<p style="color:#6b7a8d;font-size:12px">Sendt automatisk fra Forældrehelte.</p>' +
        '</div>'
    });

    // 3) Bekræftelse til forælderen
    if (data.email && data.email.indexOf('@') > -1) {
      MailApp.sendEmail({
        to: data.email,
        name: FROM_NAME,
        subject: 'Tak for din tilmelding — ' + (data.eventTitle || ''),
        htmlBody:
          '<div style="font-family:Arial,sans-serif;color:#1a2535;line-height:1.6">' +
          '<p>Hej ' + escapeHtml(firstName(data.name)) + ',</p>' +
          '<p>Tak fordi du hjælper! Du er nu tilmeldt:</p>' +
          '<table style="border-collapse:collapse;font-size:14px;margin:8px 0">' +
          row('Opgave', data.eventTitle) +
          row('Vagt / opgave', data.slotLabel) +
          (data.dateText ? row('Dato', data.dateText) : '') +
          (data.location ? row('Sted', data.location) : '') +
          '</table>' +
          '<p>Kan du alligevel ikke? Skriv til ' +
          '<a href="mailto:' + NOTIFY_EMAIL + '">' + NOTIFY_EMAIL + '</a> ' +
          'så finder vi en løsning.</p>' +
          '<p>Mange spejderhilsner,<br>Havets Helte</p>' +
          '</div>'
      });
    }

    return ContentService.createTextOutput('ok');

  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error: ' + err);
  }
}

function row(label, value) {
  return '<tr><td style="padding:3px 12px 3px 0;color:#6b7a8d">' + label +
         '</td><td style="padding:3px 0;font-weight:500">' + escapeHtml(value || '') + '</td></tr>';
}
function firstName(n) { return (n || '').split(' ')[0]; }
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}

// Praktisk test: kør denne i editoren for at sende en testmail til dig selv
function testNotification() {
  doPost({ postData: { contents: JSON.stringify({
    secret: SHARED_SECRET,
    eventTitle: 'TEST — Sankthans',
    slotLabel: '16:00 – 18:00 · Drinksboden',
    name: 'Test Forælder',
    email: NOTIFY_EMAIL,
    location: 'Sluseholmen',
    dateText: 'Tirsdag 23. juni',
    adult: true
  })}});
}
