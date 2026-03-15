<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  today?: number;
  yesterday?: number;
}>();

const percentage = computed(() => {
  const today = props.today ?? 0;
  const yesterday = props.yesterday ?? 0;

  if (today <= 0 && yesterday <= 0) {
    return 0;
  }

  if (yesterday <= 0) {
    return 100;
  }

  return Math.round(((today - yesterday) / yesterday) * 100);
});

const label = computed(() => {
  if (percentage.value === 0) {
    return "0%";
  }

  if (percentage.value > 0) {
    return `+${percentage.value}%`;
  }

  return `${percentage.value}%`;
});

const toneClass = computed(() => {
  if (percentage.value > 0) {
    return "bg-success/10 text-success";
  }

  if (percentage.value < 0) {
    return "bg-danger/10 text-danger";
  }

  return "bg-gray-100 text-gray-500";
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold"
    :class="toneClass"
    :title="`Comparativo com ontem: ${label}`"
  >
    {{ label }}
  </span>
</template>
