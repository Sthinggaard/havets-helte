<template>
  <AdminAuthGate><slot /></AdminAuthGate>
</template>

<script setup lang="ts">
import AdminAuthGate from '@/components/admin/AdminAuthGate.vue';
</script>
