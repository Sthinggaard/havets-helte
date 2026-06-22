import { createRouter, createWebHistory } from 'vue-router';

import HomePage from './pages/HomePage.vue';
import EventsPage from './pages/EventsPage.vue';
import TasksPage from './pages/TasksPage.vue';
import AttendancePage from './pages/AttendancePage.vue';
import SignupsPage from './pages/SignupsPage.vue';
import AdminShellPage from './pages/AdminShellPage.vue';

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/events', name: 'events', component: EventsPage },
  { path: '/opgaver', name: 'tasks', component: TasksPage },
  { path: '/attendance', name: 'attendance', component: AttendancePage },
  { path: '/mine-tilmeldinger', name: 'signups', component: SignupsPage },
  { path: '/admin', name: 'admin', component: AdminShellPage },
];

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

