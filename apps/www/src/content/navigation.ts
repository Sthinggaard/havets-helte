export const publicNavigationItems = [
  { path: '/', label: 'Forside' },
  { path: '/events', label: 'Arrangementer' },
  { path: '/opgaver', label: 'Opgaver' },
  { path: '/vagter', label: 'Vagter' },
  { path: '/frivillighelte', label: 'Frivillighelte' },
] as const;

export const navigationItems = [
  { path: '/', label: 'Overblik' },
  { path: '/events', label: 'Arrangementer' },
  { path: '/opgaver', label: 'Opgaver' },
  { path: '/vagter', label: 'Vagter' },
  { path: '/medlemmer', label: 'Medlemmer' },
  { path: '/grene', label: 'Grene' },
  { path: '/mine-tilmeldinger', label: 'Mine tilmeldinger' },
  { path: '/admin', label: 'Admin' },
] as const;

export const adminNavigationItems = [
  { path: '/admin', label: 'Oversigt' },
  { path: '/admin/arrangementer', label: 'Arrangementer' },
  { path: '/admin/opgaver', label: 'Opgaver' },
  { path: '/admin/vagter', label: 'Vagter' },
  { path: '/admin/fremmoede', label: 'Fremmøde' },
  { path: '/medlemmer', label: 'Medlemmer' },
  { path: '/grene', label: 'Grene' },
  { path: '/admin/billedbibliotek', label: 'Billedbibliotek' },
] as const;
