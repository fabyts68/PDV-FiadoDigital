<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useApi } from "@/composables/use-api.js";

const emit = defineEmits<{
  (e: "success"): void;
  (e: "cancel"): void;
}>();

const { authenticatedFetch } = useApi();
const managerPin = ref("");
const managerPinError = ref<string | null>(null);
const managerPinLoading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus();
  });
});

async function validateManagerPinAndProceed(): Promise<void> {
  managerPinError.value = null;
  managerPinLoading.value = true;

  try {
    const response = await authenticatedFetch("/api/auth/validate-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: managerPin.value }),
    });
    const data = await response.json();

    if (!response.ok) {
      managerPinError.value = data.message || "PIN inválido.";
      return;
    }

    emit("success");
  } catch {
    managerPinError.value = "Erro ao validar PIN.";
  } finally {
    managerPinLoading.value = false;
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sales-manager-pin-modal-title"
    @click.self="emit('cancel')"
  >
    <div class="mx-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-lg">
      <h2 id="sales-manager-pin-modal-title" class="text-lg font-bold text-slate-900">Aprovação de Gerente</h2>
      <p class="mt-1 text-sm text-slate-600">Informe o PIN para autorizar esta ação.</p>

      <input
        ref="inputRef"
        v-model="managerPin"
        type="password"
        inputmode="numeric"
        maxlength="6"
        class="mt-4 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-blue-500"
        @keydown.enter.prevent="validateManagerPinAndProceed"
      />

      <p v-if="managerPinError" class="mt-2 text-sm text-red-700">{{ managerPinError }}</p>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="h-10 rounded-md border border-slate-300 px-3 text-slate-700 hover:bg-slate-100"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="h-10 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          :disabled="managerPinLoading"
          @click="validateManagerPinAndProceed"
        >
          {{ managerPinLoading ? "Validando..." : "Confirmar" }}
        </button>
      </div>
    </div>
  </div>
</template>
