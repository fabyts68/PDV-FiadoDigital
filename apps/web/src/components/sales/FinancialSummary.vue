<script setup lang="ts">
import { formatCents } from "@pdv/shared";

defineProps<{
  totalCents: number;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  (e: "pay"): void;
  (e: "cancel"): void;
}>();
</script>

<template>
  <aside class="flex flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 md:p-3 shadow-sm min-w-0">
    <h2 class="mb-2 text-base font-semibold text-slate-900">Resumo financeiro</h2>

    <div class="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
      <p class="text-sm text-blue-700">Total a pagar</p>
      <p class="text-3xl leading-none font-bold text-blue-900 truncate" :title="formatCents(totalCents)">
        {{ formatCents(totalCents) }}
      </p>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-2">
      <button
        type="button"
        class="h-11 rounded-md bg-blue-700 font-semibold text-white transition"
        :class="isConnected ? 'hover:bg-blue-800' : 'opacity-50 cursor-not-allowed'"
        :disabled="!isConnected"
        :title="!isConnected ? 'Sem conexão com o servidor. Aguarde a reconexão.' : ''"
        @click="emit('pay')"
      >
        Finalizar venda (F4)
      </button>
      <button
        type="button"
        class="h-11 rounded-md border border-red-300 font-semibold text-red-700 hover:bg-red-50"
        @click="emit('cancel')"
      >
        Cancelar venda
      </button>
    </div>
  </aside>
</template>
