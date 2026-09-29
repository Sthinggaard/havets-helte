export const publicNavigationItems = [
  { path: '/?tab=parents', label: 'Forældreopgaver' },
  { path: '/?tab=scout-signups', label: 'Spejdertilmeldinger' },
  { path: '/frivillighelte', label: 'Frivillighelte' },
  { path: '/mine', label: 'Mine tilmeldinger' },
  { path: '/admin', label: 'Leder-login' },
] as const;

export const navigationItems = [
  { path: '/', label: 'Overblik' },
  { path: '/events', label: 'Arrangementer' },
  { path: '/medlemmer', label: 'Medlemmer' },
  { path: '/grene', label: 'Grene' },
  { path: '/mine-tilmeldinger', label: 'Mine tilmeldinger' },
  { path: '/admin', label: 'Admin' },
] as const;

export const adminNavigationItems = [
  { path: '/admin/arrangementer', label: 'Arrangementer', title: 'Arrangementer', meta: 'Opret arrangementer, opgaver og vagter', icon: 'ti ti-calendar' },
  { path: '/admin/fremmoede', label: 'Fremmøde', title: 'Fremmøde', meta: 'Vælg dag og åbn check-in', icon: 'ti ti-checkup-list' },
  { path: '/medlemmer', label: 'Medlemmer', title: 'Medlemmer', meta: 'Åbn medlemslisten og rediger', icon: 'ti ti-users' },
  { path: '/grene', label: 'Grene', title: 'Grene', meta: 'Åbn grene og medlemmer', icon: 'ti ti-git-branch' },
  { path: '/admin/billedbibliotek', label: 'Billedbibliotek', title: 'Billedbibliotek', meta: 'Upload og vælg billeder', icon: 'ti ti-photo' },
  { path: '/admin/mine', label: 'Mine tilmeldinger', title: 'Mine tilmeldinger', meta: 'Se dine egne tilmeldinger', icon: 'ti ti-clipboard-list' },
] as const;
