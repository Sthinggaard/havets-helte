<template>
  <div class="hero-meta">
    <span v-if="date" class="meta-chip">
      <i class="ti ti-calendar" aria-hidden="true"></i>
      {{ date }}
    </span>
    <a
      v-if="location"
      class="meta-chip chip-link"
      :href="buildMapsUrl(location)"
      target="_blank"
      rel="noreferrer noopener"
    >
      <i class="ti ti-map-pin" aria-hidden="true"></i>
      {{ location }}
    </a>
    <span v-if="elements !== undefined" class="meta-chip">
      <i class="ti ti-list" aria-hidden="true"></i>
      {{ elements }} elementer
    </span>
  </div>
</template>

<script setup lang="ts">
import { buildMapsUrl } from '@/lib/maps';

defineProps<{
  date?: string;
  location?: string;
  elements?: number;
}>();
</script>

<style scoped>
.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px 18px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  color: #fff;
  font-size: 0.84rem;
  font-weight: 700;
}

.chip-link {
  text-decoration: none;
}
</style>
