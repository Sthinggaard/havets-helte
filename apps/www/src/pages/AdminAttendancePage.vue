<template>
  <AdminAuthGate>
    <AdminAttendanceWorkspace />
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import AdminAttendanceWorkspace from '@/components/attendance/AdminAttendanceWorkspace.vue';
</script>
