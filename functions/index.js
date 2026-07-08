const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');
const { onRequest } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const forwardedHost = String(req.get('x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || String(req.get('host') || '').split(',')[0].trim();
  const proto = forwardedProto || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  if (!host) return 'https://havets-helte.web.app';
  return `${proto}://${host}`;
}

function buildShareDescription(event) {
  const parts = [];
  if (event.dateText) parts.push(event.dateText);
  if (event.location) parts.push(event.location);
  if (event.description) parts.push(event.description);
  return parts.join(' · ') || 'Forældrehelte har en opgave klar.';
}

function renderShareHtml({ title, description, imageUrl, shareUrl, redirectUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImageUrl = escapeHtml(imageUrl);
  const safeShareUrl = escapeHtml(shareUrl);
  const safeRedirectUrl = escapeHtml(redirectUrl);

  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${safeShareUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:locale" content="da_DK">
  <meta property="og:site_name" content="Havets Helte">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <link rel="canonical" href="${safeShareUrl}">
  <style>
    body{font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:40px;color:#232323}
    .card{max-width:640px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
    img{width:100%;height:auto;border-radius:16px;display:block;margin:16px 0 20px}
    .meta{color:#7c7c7c;font-size:14px;line-height:1.6}
    .cta{display:inline-block;margin-top:18px;background:#003366;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700}
  </style>
</head>
<body>
  <div class="card">
    <div class="meta">${safeDescription}</div>
    <img src="${safeImageUrl}" alt="${safeTitle}">
    <a class="cta" href="${safeRedirectUrl}">Åbn eventet</a>
  </div>
</body>
</html>`;
}

exports.shareEvent = onRequest({ region: 'europe-west1', cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).send('Kun GET er tilladt.');
    return;
  }

  try {
    const eventId = String(req.query.event || '').trim();
    if (!eventId) {
      res.status(400).send('Mangler event.');
      return;
    }

    const snap = await db.collection('events').doc(eventId).get();
    if (!snap.exists || snap.get('active') === false) {
      res.status(404).send('Opgaven findes ikke længere.');
      return;
    }

    const event = snap.data() || {};
    const origin = getRequestOrigin(req);
    const version = String(req.query.v || '').trim();
    const shareUrl = version
      ? `${origin}/share?event=${encodeURIComponent(eventId)}&v=${encodeURIComponent(version)}`
      : `${origin}/share?event=${encodeURIComponent(eventId)}`;
    const redirectUrl = version
      ? `${origin}/?event=${encodeURIComponent(eventId)}&v=${encodeURIComponent(version)}`
      : `${origin}/?event=${encodeURIComponent(eventId)}`;
    const imageUrl = event.imageUrl || `${origin}/og-sankthans.png`;
    const title = `${event.title || 'Forældrehelte'} · Havets Helte`;
    const description = buildShareDescription(event);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(renderShareHtml({
      title,
      description,
      imageUrl,
      shareUrl,
      redirectUrl,
    }));
  } catch (error) {
    logger.error('shareEvent failed', error);
    res.status(500).send('Kunne ikke hente delingssiden.');
  }
});
