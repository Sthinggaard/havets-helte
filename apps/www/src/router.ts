import { createRouter, createWebHistory } from 'vue-router';

import HomePage from './pages/HomePage.vue';
import EventsPage from './pages/EventsPage.vue';
import TasksPage from './pages/TasksPage.vue';
import ShiftsPage from './pages/ShiftsPage.vue';
import AttendancePage from './pages/AttendancePage.vue';
import SignupsPage from './pages/SignupsPage.vue';
import AdminShellPage from './pages/AdminShellPage.vue';

const routes = [
  { path: '/', name: 'home', component: HomePage, alias: ['/index.html'] },
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
    path: '/mine-tilmeldinger',
    name: 'signups',
    component: SignupsPage,
    alias: ['/mine-tilmeldinger.html'],
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminShellPage,
    alias: [
      '/admin.html',
      '/admin-arrangementer.html',
      '/admin-arrangementer-form.html',
      '/admin-opgaver.html',
      '/admin-opgaver-form.html',
      '/admin-vagter.html',
      '/admin-vagter-form.html',
      '/admin-medlemmer.html',
      '/admin-medlemmer-form.html',
      '/admin-fremmoede.html',
      '/admin-fremmoede-form.html',
      '/admin-billedbibliotek.html',
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
