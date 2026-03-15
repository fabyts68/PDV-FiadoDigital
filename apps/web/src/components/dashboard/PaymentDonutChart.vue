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

const total = computed(() =>
  keys.reduce((sum, key) => sum + (props.data[key] ?? 0), 0),
);

// Melhoria 4: segmentos ordenados por valor decrescente
const segments = computed<DonutSegment[]>(() => {
  const circumference = 2 * Math.PI * 52;

  const sorted = [...keys]
    .map((key) => ({ key, value: props.data[key] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  let currentOffset = 0;
  let cumulativeFraction = 0;

  return sorted.map(({ key, value }) => {
    const fraction = total.value > 0 ? value / total.value : 0;
    const segmentLength = circumference * fraction;
    const startAngle = -Math.PI / 2 + cumulativeFraction * 2 * Math.PI;
    const endAngle = startAngle + fraction * 2 * Math.PI;

    const segment: DonutSegment = {
      key,
      label: metadata[key].label,
      icon: metadata[key].icon,
      value,
      color: palette[key],
      percentage: Math.round(fraction * 100),
      dashArray: `${segmentLength} ${circumference}`,
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
  const textRadius = 52;
  return {
    x: 60 + textRadius * Math.cos(midAngle),
    y: 60 + textRadius * Math.sin(midAngle),
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

    <div v-else class="flex flex-col gap-4 md:flex-row md:items-center">
      <!-- Acessibilidade: aria-label dinâmico descrevendo todas as fatias -->
      <svg
        viewBox="0 0 120 120"
        class="h-36 w-36 shrink-0"
        role="img"
        :aria-label="`Distribuição de vendas por meio de pagamento. ${ariaChartDescription}`"
      >
        <!-- Trilha de fundo -->
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" stroke-width="14" />

        <!-- Segmentos interativos -->
        <g v-for="segment in segments" :key="segment.key">
          <circle
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
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="white"
            stroke-width="4"
            stroke-linecap="butt"
            :stroke-dasharray="`4 ${2 * Math.PI * 52 - 4}`"
            :stroke-dashoffset="segment.dashOffset"
            transform="rotate(-90 60 60)"
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
            style="font-size: 9px; font-weight: 700; fill: white; pointer-events: none"
            aria-hidden="true"
          >{{ segment.percentage }}%</text>
        </template>

        <!-- Total centralizado no buraco da rosca -->
        <text
          x="60"
          y="57"
          text-anchor="middle"
          dominant-baseline="middle"
          style="font-size: 8px; font-weight: 700; fill: #374151"
          aria-hidden="true"
        >{{ showValues ? formatCents(total) : "••••" }}</text>
        <text
          x="60"
          y="69"
          text-anchor="middle"
          style="font-size: 6px; fill: #9ca3af"
          aria-hidden="true"
        >total hoje</text>
      </svg>

      <!-- Melhoria 4: legenda ordenada por valor decrescente -->
      <ul class="flex-1 space-y-2" aria-label="Detalhes por meio de pagamento">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
        >
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <span
              class="inline-block h-3 w-3 shrink-0 rounded-sm"
              :style="{ backgroundColor: segment.color }"
              aria-hidden="true"
            />
            <span aria-hidden="true">{{ segment.icon }}</span>
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
