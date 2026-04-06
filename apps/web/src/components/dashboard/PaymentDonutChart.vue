<script setup lang="ts">
import { computed, ref } from "vue";
import { formatCents } from "@pdv/shared";

const props = defineProps<{
  data: Record<string, number>;
  showValues: boolean;
}>();

const emit = defineEmits<{
  (e: "drill-down", method: string): void;
}>();

const hoveredSlice = ref<string | null>(null);

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
  cash:        "#009E73",  // Verde-azulado (teal)
  pix:         "#0072B2",  // Azul
  credit_card: "#CC79A7",  // Rosa/púrpura
  debit_card:  "#56B4E9",  // Azul-claro (sky blue)
  fiado:       "#E69F00",  // Âmbar/laranja
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

const hoveredSegment = computed(() =>
  hoveredSlice.value
    ? segments.value.find((s) => s.key === hoveredSlice.value) ?? null
    : null,
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
    <!-- Empty State -->
    <div v-if="total <= 0" class="flex flex-col items-center gap-4 py-4">
      <svg viewBox="0 0 200 200" class="h-40 w-40">
        <circle
          :cx="chartCenter"
          :cy="chartCenter"
          :r="chartRadius"
          fill="none"
          stroke="#E2E8F0"
          :stroke-width="chartStrokeWidth"
        />
        <text
          x="100"
          y="96"
          text-anchor="middle"
          dominant-baseline="middle"
          style="font-size: 11px; fill: #94a3b8"
        >R$ 0,00</text>
      </svg>
      <div class="text-center">
        <p class="text-sm font-medium text-gray-500">Sem vendas no período selecionado</p>
        <p class="mt-1 text-xs text-gray-400">Altere o filtro de período para visualizar outros dados.</p>
      </div>
    </div>

    <!-- Donut Chart -->
    <div v-else class="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div class="flex shrink-0 flex-col items-center">
        <svg
          viewBox="0 0 200 200"
          class="h-48 w-48 sm:h-52 sm:w-52"
          role="img"
          :aria-label="`Distribuição de vendas por meio de pagamento. ${ariaChartDescription}`"
          @mouseleave="hoveredSlice = null"
        >
          <!-- Trilha de fundo -->
          <circle
            :cx="chartCenter"
            :cy="chartCenter"
            :r="chartRadius"
            fill="none"
            stroke="#e5e7eb"
            :stroke-width="chartStrokeWidth"
          />

          <!-- Segmentos interativos -->
          <g v-for="segment in segments" :key="segment.key">
            <circle
              :cx="chartCenter"
              :cy="chartCenter"
              :r="chartRadius"
              fill="none"
              :stroke="segment.color"
              :stroke-width="hoveredSlice === segment.key ? chartStrokeWidth + 4 : chartStrokeWidth"
              stroke-linecap="butt"
              :stroke-dasharray="segment.dashArray"
              :stroke-dashoffset="segment.dashOffset"
              :transform="`rotate(-90 ${chartCenter} ${chartCenter})`"
              class="cursor-pointer focus:outline-none"
              style="transition: stroke-width 0.2s ease"
              :aria-label="`${segment.label}: ${segment.percentage}% — clique para ver detalhes`"
              role="button"
              tabindex="0"
              @mouseenter="hoveredSlice = segment.key"
              @touchstart.passive="hoveredSlice = segment.key"
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
              v-if="segment.percentage > 10 && !hoveredSlice"
              :x="getTextPosition(segment.startAngle, segment.endAngle).x"
              :y="getTextPosition(segment.startAngle, segment.endAngle).y"
              text-anchor="middle"
              dominant-baseline="middle"
              class="font-bold"
              style="font-size: 11px; fill: #1e293b; stroke: white; stroke-width: 3px; paint-order: stroke fill; pointer-events: none"
              aria-hidden="true"
            >{{ segment.percentage }}%</text>
          </template>

          <!-- Centro dinâmico: Hover mostra detalhes da fatia, padrão mostra total -->
          <template v-if="hoveredSegment">
            <text
              x="100"
              y="85"
              text-anchor="middle"
              style="font-size: 10px; fill: #64748b; font-weight: 500"
              aria-hidden="true"
            >{{ hoveredSegment.icon }} {{ hoveredSegment.label }}</text>
            <text
              x="100"
              y="102"
              text-anchor="middle"
              style="font-size: 14px; font-weight: 700; fill: #1e293b"
              aria-hidden="true"
            >{{ showValues ? formatCents(hoveredSegment.value) : "••••" }}</text>
            <text
              x="100"
              y="117"
              text-anchor="middle"
              style="font-size: 11px; font-weight: 600"
              :style="{ fill: hoveredSegment.color }"
              aria-hidden="true"
            >{{ hoveredSegment.percentage }}%</text>
          </template>
          <template v-else>
            <text
              x="100"
              y="94"
              text-anchor="middle"
              style="font-size: 14px; font-weight: 700; fill: #1e293b"
              aria-hidden="true"
            >{{ showValues ? formatCents(total) : "••••" }}</text>
            <text
              x="100"
              y="112"
              text-anchor="middle"
              style="font-size: 9px; fill: #64748b"
              aria-hidden="true"
            >Total</text>
          </template>
        </svg>
        <p class="mt-2 text-center text-xs text-gray-400">👆 Toque em uma fatia para ver detalhes</p>
      </div>

      <!-- Legenda rica -->
      <ul
        class="grid w-full grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-1.5"
        aria-label="Detalhes por meio de pagamento"
      >
        <li
          v-for="segment in segments"
          :key="segment.key"
          :class="[
            'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-all',
            segment.value === 0
              ? 'border-gray-50 opacity-40'
              : hoveredSlice === segment.key
                ? 'border-primary/30 bg-primary/5 shadow-sm'
                : 'border-gray-100',
          ]"
          @mouseenter="hoveredSlice = segment.key"
          @mouseleave="hoveredSlice = null"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="inline-block h-3 w-3 shrink-0 rounded-full"
              :style="{ backgroundColor: segment.color }"
              aria-hidden="true"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-700">{{ segment.label }}</p>
              <p class="text-xs text-gray-500">{{ displayValue(segment.value) }}</p>
            </div>
          </div>
          <span class="shrink-0 text-base font-bold text-gray-800">{{ segment.percentage }}%</span>
        </li>
      </ul>
    </div>
  </div>
</template>
