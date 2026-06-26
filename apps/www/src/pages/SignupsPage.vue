<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div>
          <p class="eyebrow">Mine tilmeldinger</p>
          <h1 class="page-title">Samlet oversigt</h1>
        </div>
      </template>
      <p class="lead">Denne route holder den personlige oversigt adskilt fra de øvrige flows.</p>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
</script>

