<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useNotifications } from "@/composables/use-notifications.js";
import type { NotificationToast } from "@/composables/use-notifications.js";
import type { Notification } from "@pdv/shared";
import { useAuthStore } from "@/stores/auth.store.js";

const router = useRouter();
const auth = useAuthStore();
const { toasts, dismissToast, acknowledge, markAsRead } = useNotifications();

function severityClass(severity: Notification["severity"]): string {
  if (severity === "critical") return "border-danger bg-danger/10";
  if (severity === "high") return "border-warning bg-warning/10";
  if (severity === "medium") return "border-primary bg-primary/10";
  return "border-gray-300 bg-surface";
}

function severityIconClass(severity: Notification["severity"]): string {
  if (severity === "critical") return "text-danger";
  if (severity === "high") return "text-warning";
  if (severity === "medium") return "text-primary";
  return "text-gray-400";
}

function severityLabel(severity: Notification["severity"]): string {
  if (severity === "critical") return "CRÍTICO";
  if (severity === "high") return "ALTO";
  if (severity === "medium") return "MÉDIO";
  return "INFO";
}

function canAcknowledge(toast: NotificationToast): boolean {
  const role = auth.user?.role;
  return (
    toast.notification.severity === "critical" &&
    !toast.notification.acknowledged_by &&
    (role === "admin" || role === "manager")
  );
}

async function handleView(toast: NotificationToast): Promise<void> {
  await markAsRead(toast.notification.id);
  dismissToast(toast.notification.id);

  try {
    const meta = toast.notification.meta ? (JSON.parse(toast.notification.meta) as { redirectPath?: string }) : null;
    if (meta?.redirectPath) {
      await router.push(meta.redirectPath);
    }
  } catch {
    // meta inválida — ignora redirect
  }
}

async function handleAcknowledge(toast: NotificationToast): Promise<void> {
  await acknowledge(toast.notification.id);
}

onMounted(() => {
  // Garantir acessibilidade: ao montar toasts, focar no primeiro persistente
});

onUnmounted(() => {
  // nenhum cleanup necessário — toasts são geridos pelo composable global
});
</script>

<template>
  <!-- Toasts de notificação — canto inferior direito -->
  <div
    class="fixed bottom-4 right-4 z-100 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    aria-label="Notificações em tempo real"
  >
    <TransitionGroup name="toast-slide">
      <div
        v-for="toast in toasts"
        :key="toast.notification.id"
        :class="[
          'pointer-events-auto rounded-lg border-l-4 shadow-lg px-4 py-3 bg-white',
          severityClass(toast.notification.severity),
        ]"
        :role="toast.notification.severity === 'critical' || toast.notification.severity === 'high' ? 'alert' : 'status'"
        :aria-live="toast.notification.severity === 'critical' || toast.notification.severity === 'high' ? 'assertive' : 'polite'"
      >
        <div class="flex items-start gap-3">
          <span :class="['text-lg', severityIconClass(toast.notification.severity)]">●</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span :class="['text-xs font-bold', severityIconClass(toast.notification.severity)]">
                {{ severityLabel(toast.notification.severity) }}
              </span>
              <p class="text-sm font-semibold text-gray-900 truncate">{{ toast.notification.title }}</p>
            </div>
            <p class="text-xs text-gray-600 mt-0.5 line-clamp-2">{{ toast.notification.message }}</p>
            <div class="flex items-center gap-2 mt-2">
              <button
                type="button"
                class="text-xs text-primary hover:underline focus:outline-none"
                @click="handleView(toast)"
              >
                Ver
              </button>
              <button
                v-if="canAcknowledge(toast)"
                type="button"
                class="text-xs text-success hover:underline focus:outline-none"
                @click="handleAcknowledge(toast)"
              >
                Confirmar
              </button>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 text-lg leading-none focus:outline-none"
            :aria-label="`Fechar notificação: ${toast.notification.title}`"
            @click="dismissToast(toast.notification.id)"
          >
            ×
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
