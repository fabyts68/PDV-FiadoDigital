<script setup lang="ts">
import { computed } from "vue";
import { formatCents } from "@pdv/shared";

const props = defineProps<{
  data: Record<string, number>;
  showValues: boolean;
}>();

interface DonutSegment {
  key: string;
  label: string;
  icon: string;
  value: number;
  color: string;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

const palette: Record<string, string> = {
  cash: "#16a34a",
  pix: "#0ea5e9",
  credit_card: "#4f46e5",
  debit_card: "#8b5cf6",
  fiado: "#f59e0b",
};

const metadata: Record<string, { label: string; icon: string }> = {
  cash: { label: "Dinheiro", icon: "💵" },
  pix: { label: "Pix", icon: "📱" },
  credit_card: { label: "Crédito", icon: "💳" },
  debit_card: { label: "Débito", icon: "💳" },
  fiado: { label: "Fiado", icon: "📒" },
};

const total = computed(() => {
  return Object.values(props.data).reduce((sum, value) => sum + (value ?? 0), 0);
});

const segments = computed<DonutSegment[]>(() => {
  const keys = ["cash", "pix", "credit_card", "debit_card", "fiado"];
  const circumference = 2 * Math.PI * 52;
  let currentOffset = 0;

  return keys.map((key) => {
    const value = props.data[key] ?? 0;
    const percentage = total.value > 0 ? value / total.value : 0;
    const segmentLength = circumference * percentage;
    const segment: DonutSegment = {
      key,
      label: metadata[key]?.label ?? key,
      icon: metadata[key]?.icon ?? "•",
      value,
      color: palette[key] ?? "#9ca3af",
      percentage: Math.round(percentage * 100),
      dashArray: `${segmentLength} ${circumference}`,
      dashOffset: -currentOffset,
    };

    currentOffset += segmentLength;
    return segment;
  });
});

function displayValue(value: number): string {
  if (!props.showValues) {
    return "R$ ••••";
  }

  return formatCents(value);
}
</script>

<template>
  <div>
    <p v-if="total <= 0" class="text-sm text-gray-400">Nenhuma venda registrada hoje.</p>

    <div v-else class="flex flex-col gap-4 md:flex-row md:items-center">
      <svg viewBox="0 0 120 120" class="h-36 w-36 shrink-0" role="img" aria-label="Distribuição de pagamentos">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" stroke-width="14" />
        <circle
          v-for="segment in segments"
          :key="segment.key"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          :stroke="segment.color"
          stroke-width="14"
          stroke-linecap="butt"
          :stroke-dasharray="segment.dashArray"
          :stroke-dashoffset="segment.dashOffset"
          transform="rotate(-90 60 60)"
        />
      </svg>

      <ul class="flex-1 space-y-2">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
        >
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <span>{{ segment.icon }}</span>
            <span>{{ segment.label }}</span>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-900">{{ displayValue(segment.value) }}</p>
            <p class="text-xs text-gray-500">{{ segment.percentage }}%</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
