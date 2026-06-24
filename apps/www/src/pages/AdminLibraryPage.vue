<template>
  <AdminAuthGate>
    <LibraryWorkspace />
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import LibraryWorkspace from '@/components/library/LibraryWorkspace.vue';
</script>
