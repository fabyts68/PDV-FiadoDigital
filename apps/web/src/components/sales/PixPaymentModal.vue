<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import QRCode from "qrcode";
import { formatCents } from "@pdv/shared";
import { usePixPolling } from "@/composables/use-pix-polling.js";

const props = defineProps<{
  pixCents: number;
}>();

const emit = defineEmits<{
  (e: "pix-confirmed", source: "manual" | "automatic"): void;
  (e: "cancel"): void;
}>();

const pixQRCodeCanvasRef = ref<HTMLCanvasElement | null>(null);
const showPixManualConfirmModal = ref(false);
const pixCopied = ref(false);
const manualConfirmLoading = ref(false);

const {
  pixQRCodePayload,
  pixQRCodeMerchantName,
  pixQRCodeLoading,
  pixQRCodeError,
  pixQRCodeExpired,
  pixStatusPollingError,
  pixStatusLabel,
  pixQRCodeTimeoutFormatted,
  pixKeySuffix,
  generatePixQRCode,
  stopPolling
} = usePixPolling({
  onAutomaticConfirm: () => {
    emit("pix-confirmed", "automatic");
  }
});

onMounted(() => {
  void generatePixQRCode(props.pixCents);
});

onUnmounted(() => {
  stopPolling();
});

watch(pixQRCodePayload, async (newPayload) => {
  if (newPayload) {
    await nextTick();
    if (pixQRCodeCanvasRef.value) {
      await QRCode.toCanvas(pixQRCodeCanvasRef.value, newPayload, {
        width: 220,
        margin: 1,
      });
    }
  }
});

async function copyPixCodigo(): Promise<void> {
  if (!pixQRCodePayload.value) return;
  try {
    await navigator.clipboard.writeText(pixQRCodePayload.value);
    pixCopied.value = true;
    setTimeout(() => { pixCopied.value = false; }, 2000);
  } catch {}
}

function openPixManualConfirmModal(): void {
  showPixManualConfirmModal.value = true;
}

function closePixManualConfirmModal(): void {
  showPixManualConfirmModal.value = false;
}

function confirmPixReceivedManual(): void {
  manualConfirmLoading.value = true;
  emit("pix-confirmed", "manual");
}

function handleCancel() {
  if (!pixQRCodeLoading.value && !showPixManualConfirmModal.value) {
    emit("cancel");
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sales-pix-qrcode-modal-title"
    @click.self="handleCancel"
  >
    <div class="mx-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-lg">
      <h2 id="sales-pix-qrcode-modal-title" class="text-lg font-bold text-slate-900">Confirmar Pagamento Pix</h2>

      <div v-if="pixQRCodeLoading" class="mt-4 text-center text-sm text-slate-600">
        Gerando QR Code...
      </div>

      <div v-else-if="!pixQRCodeExpired" class="mt-4">
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p class="text-sm text-blue-700">Valor a pagar</p>
          <p class="text-2xl font-bold text-blue-900">{{ formatCents(pixCents) }}</p>
          <p class="mt-2 text-xs text-blue-600">Estabelecimento: {{ pixQRCodeMerchantName }}</p>
        </div>

        <div v-if="pixQRCodePayload" class="mt-4 space-y-3">
          <div class="rounded-lg bg-slate-50 p-3">
            <p class="mb-2 text-sm font-medium text-slate-700">Escaneie o QR Code</p>
            <div class="flex justify-center">
              <canvas ref="pixQRCodeCanvasRef" class="h-40 w-40 border border-slate-200"></canvas>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-3">
            <p class="mb-2 text-sm font-medium text-slate-700">Copia e Cola</p>
            <div class="flex gap-2">
              <input
                :value="pixQRCodePayload"
                type="text"
                readonly
                class="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-xs outline-none"
              />
              <button
                type="button"
                class="h-11 rounded-md px-3 transition"
                :class="pixCopied ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'"
                @click="copyPixCodigo"
              >
                {{ pixCopied ? 'Copiado!' : 'Copiar' }}
              </button>
            </div>
          </div>

          <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p class="text-sm text-amber-800">
              Validade:
              <strong>{{ pixQRCodeTimeoutFormatted }}</strong>
            </p>
            <p class="mt-1 text-sm text-amber-800">
              {{ pixStatusLabel }}
            </p>
            <p class="mt-2 text-sm text-amber-900">
              Verifique o recebimento no aplicativo do banco antes de confirmar.
            </p>
          </div>
        </div>

        <p v-if="pixQRCodeError" role="alert" class="mt-3 text-sm text-red-700">
          {{ pixQRCodeError }}
        </p>

        <p v-if="pixStatusPollingError" role="status" aria-live="polite" class="mt-2 text-sm text-amber-700">
          {{ pixStatusPollingError }}
        </p>

        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="min-h-11 rounded-md border border-slate-300 px-4 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            :disabled="pixQRCodeLoading"
            @click="emit('cancel')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="min-h-11 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            :disabled="pixQRCodeLoading"
            @click="openPixManualConfirmModal"
          >
            Confirmar Recebimento do Pix
          </button>
        </div>
      </div>

      <div v-else class="mt-4">
        <div class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">QR Code expirado. Gere um novo para continuar.</p>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="min-h-11 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800"
            @click="emit('cancel')"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showPixManualConfirmModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sales-pix-manual-modal-title"
    @click.self="!manualConfirmLoading && closePixManualConfirmModal()"
  >
    <div class="mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-lg">
      <h2 id="sales-pix-manual-modal-title" class="text-lg font-bold text-slate-900">Confirmar Recebimento do Pix</h2>

      <div class="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p>
          Confirme que o pagamento de <strong>{{ formatCents(pixCents) }}</strong> foi recebido no Pix antes de finalizar a venda.
        </p>
        <p>
          Chave Pix (final): <strong>{{ pixKeySuffix }}</strong>
        </p>
        <p class="text-amber-800">
          Verifique no aplicativo do banco para evitar confirmação indevida.
        </p>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="min-h-11 rounded-md border border-slate-300 px-4 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          :disabled="manualConfirmLoading"
          @click="closePixManualConfirmModal"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="min-h-11 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          :disabled="manualConfirmLoading"
          @click="confirmPixReceivedManual"
        >
          {{ manualConfirmLoading ? "Finalizando..." : "Confirmar e Finalizar" }}
        </button>
      </div>
    </div>
  </div>
</template>
