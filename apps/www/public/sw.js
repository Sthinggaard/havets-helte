// Installability foundation only: no fetch handler means that live event,
// booking and safety data always comes from the network. Offline support and
// push notifications will be added as separately approved capabilities.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
