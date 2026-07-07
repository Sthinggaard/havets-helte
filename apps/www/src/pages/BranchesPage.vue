<template>
  <AdminAuthGate>
    <BranchesWorkspace />
  </AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
import BranchesWorkspace from '@/components/branches/BranchesWorkspace.vue';
</script>
