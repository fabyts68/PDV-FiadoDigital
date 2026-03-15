<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ today?: number; yesterday?: number }>();

const trend = computed(() => {
  if (!props.today || !props.yesterday || props.yesterday === 0) {
    return null;
  }

  const diff = ((props.today - props.yesterday) / props.yesterday) * 100;

  return {
    value: Math.abs(diff).toFixed(1),
    positive: diff >= 0,
  };
});
</script>

<template>
  <span
    v-if="trend"
    :class="[
      'rounded-full px-1.5 py-0.5 text-xs font-semibold',
      trend.positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
    ]"
  >
    {{ trend.positive ? "▲" : "▼" }} {{ trend.value }}%
  </span>
</template>
