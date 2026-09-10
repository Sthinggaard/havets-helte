import { createRouter, createWebHistory } from 'vue-router';

// Home is eager for fast first paint; every other route is split into its own chunk.
import HomePage from './pages/HomePage.vue';

const EventsPage = () => import('./pages/EventsPage.vue');
const TasksPage = () => import('./pages/TasksPage.vue');
const ShiftsPage = () => import('./pages/ShiftsPage.vue');
const AttendancePage = () => import('./pages/AttendancePage.vue');
const AdminAttendancePage = () => import('./pages/AdminAttendancePage.vue');
const VolunteerLeaderboardPage = () => import('./pages/VolunteerLeaderboardPage.vue');
const ParentAccessPage = () => import('./pages/ParentAccessPage.vue');
const MembersPage = () => import('./pages/MembersPage.vue');
const BranchesPage = () => import('./pages/BranchesPage.vue');
const AdminLibraryPage = () => import('./pages/AdminLibraryPage.vue');
const AdminArrangementerPage = () => import('./pages/AdminArrangementerPage.vue');
const AdminOpgaverPage = () => import('./pages/AdminOpgaverPage.vue');
const AdminVagterPage = () => import('./pages/AdminVagterPage.vue');
const AdminSignupsPage = () => import('./pages/AdminSignupsPage.vue');
const AdminShellPage = () => import('./pages/AdminShellPage.vue');

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    alias: ['/index.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/events',
    name: 'events',
    component: EventsPage,
    alias: ['/events.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/opgaver',
    name: 'tasks',
    component: TasksPage,
    alias: ['/opgaver.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/vagter',
    name: 'shifts',
    component: ShiftsPage,
    alias: ['/vagter.html'],
    meta: { shell: 'landing' },
  },
  { path: '/vagter/:eventId/tilmeldte', name: 'admin-shift-signups', component: AdminSignupsPage },
  { path: '/vagter/:eventId/tilmelde', name: 'admin-shift-signups-short', component: AdminSignupsPage },
  { path: '/vagter/:eventId/rediger', name: 'admin-shift-edit', component: AdminVagterPage },
  {
    path: '/attendance',
    name: 'attendance',
    component: AttendancePage,
    alias: ['/attendance.html'],
    meta: { shell: 'attendance' },
  },
  {
    path: '/admin/fremmoede',
    name: 'admin-attendance',
    component: AdminAttendancePage,
    alias: ['/admin-fremmoede-setup.html'],
  },
  {
    path: '/medlemmer',
    name: 'members',
    component: MembersPage,
    alias: ['/medlemmer.html', '/admin-medlemmer.html', '/admin-medlemmer-form.html'],
  },
  {
    path: '/grene',
    name: 'branches',
    component: BranchesPage,
    alias: ['/grene.html', '/admin-grene.html'],
  },
  {
    path: '/mine-tilmeldinger',
    name: 'signups',
    component: ParentAccessPage,
    alias: ['/mine-tilmeldinger.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/mine',
    name: 'parent-access',
    component: ParentAccessPage,
    meta: { shell: 'landing' },
  },
  {
    path: '/frivillighelte',
    name: 'volunteer-leaderboard',
    component: VolunteerLeaderboardPage,
    meta: { shell: 'landing' },
  },
  {
    path: '/admin/billedbibliotek',
    name: 'admin-library',
    component: AdminLibraryPage,
    alias: ['/admin-billedbibliotek.html'],
  },
  {
    path: '/admin/opgaver',
    name: 'admin-opgaver',
    component: AdminOpgaverPage,
    alias: ['/admin-opgaver.html', '/admin-opgaver-form.html'],
  },
  {
    path: '/admin/vagter',
    name: 'admin-vagter',
    component: AdminVagterPage,
    alias: ['/admin-vagter.html', '/admin-vagter-form.html'],
  },
  { path: '/admin/tilmeldte', name: 'admin-signups', component: AdminSignupsPage },
  {
    path: '/admin/arrangementer',
    name: 'admin-arrangementer',
    component: AdminArrangementerPage,
    alias: ['/admin-arrangementer.html', '/admin-arrangementer-form.html'],
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminShellPage,
    alias: [
      '/admin.html',
      '/admin-fremmoede.html',
      '/admin-fremmoede-form.html',
      '/backfill-groups.html',
      '/seed.html',
    ],
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
