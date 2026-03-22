<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth.store.js";
import { useWebSocket } from "@/composables/use-websocket.js";

defineProps<{
  terminalId: string;
  customerName?: string | null;
}>();

const emit = defineEmits<{
  (e: "help"): void;
}>();

const authStore = useAuthStore();
const { isConnected } = useWebSocket();

const isPanelCollapsed = ref(true);
const now = ref(new Date());
const isOnline = ref(navigator.onLine);

let clockInterval: ReturnType<typeof setInterval> | null = null;

function handleOnlineStatus() {
  isOnline.value = navigator.onLine;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

onMounted(() => {
  clockInterval = setInterval(() => {
    now.value = new Date();
  }, 1000);

  window.addEventListener("online", handleOnlineStatus);
  window.addEventListener("offline", handleOnlineStatus);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
  window.removeEventListener("online", handleOnlineStatus);
  window.removeEventListener("offline", handleOnlineStatus);
});
</script>

<template>
  <section
    class="sticky top-0 z-20 mb-2 rounded-xl border border-slate-200 bg-white shadow-sm md:grid md:grid-cols-5 md:gap-2 md:p-2"
    :class="isPanelCollapsed ? 'p-2' : 'p-3'"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between md:hidden"
      :aria-expanded="!isPanelCollapsed"
      aria-label="Expandir informações do caixa"
      @click="isPanelCollapsed = !isPanelCollapsed"
    >
      <span class="truncate text-sm font-medium text-gray-700">
        {{ terminalId }} {{ customerName ? `· ${customerName}` : "· Sem cliente" }}
      </span>
      <span
        class="ml-2 text-gray-400 transition-transform duration-200"
        :class="isPanelCollapsed ? 'rotate-0' : 'rotate-180'"
      >
        ▼
      </span>
    </button>

    <div
      class="transition-all duration-200"
      :class="isPanelCollapsed ? 'hidden md:contents' : 'mt-2 grid grid-cols-1 gap-3 md:contents md:gap-0 md:mt-0'"
    >
      <div>
        <p class="text-xs text-slate-500">Terminal</p>
        <p class="text-base font-semibold text-slate-900">{{ terminalId }}</p>
      </div>
      <div>
        <p class="text-xs text-slate-500">Operador</p>
        <p class="text-base font-semibold text-slate-900">{{ authStore.user?.name || "N/D" }}</p>
      </div>
      <div>
        <p class="text-xs text-slate-500">Data e hora</p>
        <p class="text-base font-semibold text-slate-900">{{ formatDateTime(now) }}</p>
      </div>
      <div class="flex flex-col gap-1">
        <span class="inline-flex items-center gap-2 text-sm">
          <span :class="isOnline ? 'text-green-600' : 'text-red-600'">●</span>
          <span class="text-slate-700">{{ isOnline ? "Online" : "Offline" }}</span>
        </span>
        <span class="inline-flex items-center gap-2 text-sm">
          <span :class="isConnected ? 'text-green-600' : 'text-red-600'">●</span>
          <span class="text-slate-700">WebSocket</span>
        </span>
      </div>
      <div>
        <p class="text-xs text-slate-500">Ações</p>
        <button
          type="button"
          class="mt-1 flex h-7 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          @click="emit('help')"
        >
          Ajuda (F1)
        </button>
      </div>
    </div>
  </section>
</template>
