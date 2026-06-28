import { createRouter, createWebHistory } from 'vue-router';

// Home is eager for fast first paint; every other route is split into its own chunk.
import HomePage from './pages/HomePage.vue';

const EventsPage = () => import('./pages/EventsPage.vue');
const TasksPage = () => import('./pages/TasksPage.vue');
const ShiftsPage = () => import('./pages/ShiftsPage.vue');
const AttendancePage = () => import('./pages/AttendancePage.vue');
const SignupsPage = () => import('./pages/SignupsPage.vue');
const MembersPage = () => import('./pages/MembersPage.vue');
const BranchesPage = () => import('./pages/BranchesPage.vue');
const AdminLibraryPage = () => import('./pages/AdminLibraryPage.vue');
const AdminArrangementerPage = () => import('./pages/AdminArrangementerPage.vue');
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
    alias: ['/opgaver.html', '/admin-opgaver.html', '/admin-opgaver-form.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/vagter',
    name: 'shifts',
    component: ShiftsPage,
    alias: ['/vagter.html', '/admin-vagter.html', '/admin-vagter-form.html'],
    meta: { shell: 'landing' },
  },
  {
    path: '/attendance',
    name: 'attendance',
    component: AttendancePage,
    alias: ['/attendance.html'],
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
    component: SignupsPage,
    alias: ['/mine-tilmeldinger.html'],
  },
  {
    path: '/admin/billedbibliotek',
    name: 'admin-library',
    component: AdminLibraryPage,
    alias: ['/admin-billedbibliotek.html'],
  },
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
