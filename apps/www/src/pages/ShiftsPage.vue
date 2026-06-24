<template>
  <AdminAuthGate>
    <EventAdminWorkspace section="vagter" />
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import EventAdminWorkspace from '@/components/admin/EventAdminWorkspace.vue';
</script>
