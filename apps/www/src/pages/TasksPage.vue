<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div>
          <p class="eyebrow">Opgaver</p>
          <h1 class="page-title">Opgave-route</h1>
        </div>
      </template>
      <div class="grid-cards">
        <article v-for="task in taskSummaries" :key="task.title" class="mini-card">
          <h2 class="row-title">{{ task.title }}</h2>
          <p class="row-copy">{{ task.description }}</p>
        </article>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { taskSummaries } from '@/features/tasks/taskSummaries';
</script>
