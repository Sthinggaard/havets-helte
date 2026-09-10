<template>
  <AdminAuthGate>
    <LegacyShiftsPage :admin-mode="true" />
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import LegacyShiftsPage from '@/components/public/LegacyShiftsPage.vue';
</script>
