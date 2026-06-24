import { createRouter, createWebHistory } from 'vue-router';

import HomePage from './pages/HomePage.vue';
import EventsPage from './pages/EventsPage.vue';
import TasksPage from './pages/TasksPage.vue';
import ShiftsPage from './pages/ShiftsPage.vue';
import AttendancePage from './pages/AttendancePage.vue';
import SignupsPage from './pages/SignupsPage.vue';
import MembersPage from './pages/MembersPage.vue';
import BranchesPage from './pages/BranchesPage.vue';
import AdminLibraryPage from './pages/AdminLibraryPage.vue';
import AdminArrangementerPage from './pages/AdminArrangementerPage.vue';
import AdminShellPage from './pages/AdminShellPage.vue';

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
  },
  {
    path: '/opgaver',
    name: 'tasks',
    component: TasksPage,
    alias: ['/opgaver.html'],
  },
  {
    path: '/vagter',
    name: 'shifts',
    component: ShiftsPage,
    alias: ['/vagter.html'],
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
      '/admin-opgaver.html',
      '/admin-opgaver-form.html',
      '/admin-vagter.html',
      '/admin-vagter-form.html',
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
