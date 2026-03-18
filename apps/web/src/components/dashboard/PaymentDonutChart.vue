<script setup lang="ts">
import { computed } from "vue";
import { formatCents } from "@pdv/shared";

const props = defineProps<{
  data: Record<string, number>;
  showValues: boolean;
}>();

const emit = defineEmits<{
  (e: "drill-down", method: string): void;
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
  startAngle: number;
  endAngle: number;
  isDebitCard: boolean;
}

type PaymentKey = "cash" | "pix" | "credit_card" | "debit_card" | "fiado";

const palette: Record<PaymentKey, string> = {
  cash:        "#16a34a",
  pix:         "#2563eb",
  credit_card: "#7c3aed",
  debit_card:  "#0891b2",
  fiado:       "#d97706",
};

const metadata: Record<PaymentKey, { label: string; icon: string }> = {
  cash:        { label: "Dinheiro", icon: "💵" },
  pix:         { label: "Pix",      icon: "📱" },
  credit_card: { label: "Crédito",  icon: "💳" },
  debit_card:  { label: "Débito",   icon: "💳" },
  fiado:       { label: "Fiado",    icon: "📒" },
};

const keys: PaymentKey[] = ["cash", "pix", "credit_card", "debit_card", "fiado"];
const chartCenter = 100;
const chartRadius = 78;
const chartStrokeWidth = 24;
const chartCircumference = 2 * Math.PI * chartRadius;

const total = computed(() =>
  keys.reduce((sum, key) => sum + (props.data[key] ?? 0), 0),
);

// Melhoria 4: segmentos ordenados por valor decrescente
const segments = computed<DonutSegment[]>(() => {
  const sorted = [...keys]
    .map((key) => ({ key, value: props.data[key] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  let currentOffset = 0;
  let cumulativeFraction = 0;

  return sorted.map(({ key, value }) => {
    const fraction = total.value > 0 ? value / total.value : 0;
    const segmentLength = chartCircumference * fraction;
    const startAngle = -Math.PI / 2 + cumulativeFraction * 2 * Math.PI;
    const endAngle = startAngle + fraction * 2 * Math.PI;

    const segment: DonutSegment = {
      key,
      label: metadata[key].label,
      icon: metadata[key].icon,
      value,
      color: palette[key],
      percentage: Math.round(fraction * 100),
      dashArray: `${segmentLength} ${chartCircumference}`,
      dashOffset: -currentOffset,
      startAngle,
      endAngle,
      isDebitCard: key === "debit_card",
    };

    currentOffset += segmentLength;
    cumulativeFraction += fraction;

    return segment;
  });
});

// Acessibilidade: descrição textual do gráfico para leitores de tela
const ariaChartDescription = computed(() =>
  segments.value
    .filter((s) => s.percentage > 0)
    .map((s) => `${s.label}: ${s.percentage}%`)
    .join(", "),
);

function displayValue(value: number): string {
  if (!props.showValues) {
    return "R$ ••••";
  }

  return formatCents(value);
}

function getTextPosition(startAngle: number, endAngle: number) {
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = chartRadius;
  return {
    x: chartCenter + textRadius * Math.cos(midAngle),
    y: chartCenter + textRadius * Math.sin(midAngle),
  };
}

// Melhoria 7: drilldown ao clicar em uma fatia
function onSegmentClick(key: string): void {
  emit("drill-down", key);
}

function onSegmentKeydown(event: KeyboardEvent, key: string): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSegmentClick(key);
  }
}
</script>

<template>
  <div>
    <p v-if="total <= 0" class="text-sm text-gray-500">Nenhuma venda registrada hoje.</p>

    <div v-else class="flex min-w-0 flex-col gap-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-6">
      <!-- Acessibilidade: aria-label dinâmico descrevendo todas as fatias -->
      <svg
        viewBox="0 0 200 200"
        class="h-48 w-48 shrink-0 self-center md:h-56 md:w-56"
        role="img"
        :aria-label="`Distribuição de vendas por meio de pagamento. ${ariaChartDescription}`"
      >
        <!-- Trilha de fundo -->
        <circle :cx="chartCenter" :cy="chartCenter" :r="chartRadius" fill="none" stroke="#e5e7eb" :stroke-width="chartStrokeWidth" />

        <!-- Segmentos interativos -->
        <g v-for="segment in segments" :key="segment.key">
          <circle
            :cx="chartCenter"
            :cy="chartCenter"
            :r="chartRadius"
            fill="none"
            :stroke="segment.color"
            :stroke-width="chartStrokeWidth"
            stroke-linecap="butt"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            :transform="`rotate(-90 ${chartCenter} ${chartCenter})`"
            class="cursor-pointer transition-opacity hover:opacity-75 focus:opacity-75 focus:outline-none"
            :aria-label="`${segment.label}: ${segment.percentage}% — clique para ver detalhes`"
            role="button"
            tabindex="0"
            @click="onSegmentClick(segment.key)"
            @keydown="onSegmentKeydown($event, segment.key)"
          >
            <title>{{ segment.label }}: {{ segment.percentage }}%</title>
          </circle>

          <!-- Padrão de tracejado adicional no segmento de Débito (acessibilidade daltonismo) -->
          <circle
            v-if="segment.isDebitCard && segment.percentage > 0"
            :cx="chartCenter"
            :cy="chartCenter"
            :r="chartRadius"
            fill="none"
            stroke="white"
            stroke-width="4"
            stroke-linecap="butt"
            :stroke-dasharray="`4 ${chartCircumference - 4}`"
            :stroke-dashoffset="segment.dashOffset"
            :transform="`rotate(-90 ${chartCenter} ${chartCenter})`"
            style="pointer-events: none"
            aria-hidden="true"
          />
        </g>

        <!-- Percentual dentro das fatias maiores -->
        <template v-for="segment in segments" :key="`pct-${segment.key}`">
          <text
            v-if="segment.percentage > 10"
            :x="getTextPosition(segment.startAngle, segment.endAngle).x"
            :y="getTextPosition(segment.startAngle, segment.endAngle).y"
            text-anchor="middle"
            dominant-baseline="middle"
            class="font-bold"
            style="font-size: 11px; fill: #1e293b; stroke: white; stroke-width: 3px; paint-order: stroke fill; pointer-events: none"
            aria-hidden="true"
          >{{ segment.percentage }}%</text>
        </template>

        <!-- Total centralizado no buraco da rosca -->
        <text
          x="100"
          y="92"
          text-anchor="middle"
          style="font-size: 13px; font-weight: 700; fill: #1e293b"
          aria-hidden="true"
        >{{ showValues ? formatCents(total) : "••••" }}</text>
        <text
          x="100"
          y="110"
          text-anchor="middle"
          style="font-size: 9px; fill: #64748b"
          aria-hidden="true"
        >total hoje</text>
      </svg>

      <!-- Melhoria 4: legenda ordenada por valor decrescente -->
      <ul class="min-w-0 w-full space-y-1.5" aria-label="Detalhes por meio de pagamento">
        <li
          v-for="segment in segments"
          :key="segment.key"
          :class="[
            'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-lg border px-3 py-2 transition-opacity',
            segment.value === 0 ? 'border-gray-50 opacity-40' : 'border-gray-100'
          ]"
        >
          <div class="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-gray-700">
            <span
              class="inline-block h-3 w-3 shrink-0 rounded-sm"
              :style="{ backgroundColor: segment.color }"
              aria-hidden="true"
            />
            <span aria-hidden="true">{{ segment.icon }}</span>
            <span class="truncate">{{ segment.label }}</span>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-sm font-semibold text-gray-900">{{ displayValue(segment.value) }}</p>
            <p class="text-xs text-gray-500">{{ segment.percentage }}%</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
