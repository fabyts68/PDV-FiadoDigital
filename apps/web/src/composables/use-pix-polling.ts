import { ref, computed } from "vue";
import { useApi } from "@/composables/use-api.js";

interface UsePixPollingOptions {
  onAutomaticConfirm?: () => void;
  onExpired?: () => void;
}

export function usePixPolling(options: UsePixPollingOptions = {}) {
  const { authenticatedFetch } = useApi();

  const pixQRCodePayload = ref<string>("");
  const pixQRCodeTxId = ref<string>("");
  const pixQRCodeMerchantName = ref<string>("");
  const pixQRCodeTimeoutSeconds = ref<number>(300); // 5 minutos
  const pixQRCodeLoading = ref(false);
  const pixQRCodeError = ref<string | null>(null);
  const pixQRCodeExpired = ref(false);

  const pixStatusPollingError = ref<string | null>(null);
  const pixStatusLabel = ref<string>("Aguardando confirmação do Pix...");

  let pixQRCodeCountdownInterval: ReturnType<typeof setInterval> | null = null;
  let pixStatusPollingInterval: ReturnType<typeof setInterval> | null = null;

  const pixQRCodeTimeoutFormatted = computed(() => {
    const minutes = Math.floor(pixQRCodeTimeoutSeconds.value / 60);
    const seconds = pixQRCodeTimeoutSeconds.value % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  });

  function parsePixTlv(rawValue: string): Map<string, string> {
    const fields = new Map<string, string>();
    let offset = 0;

    while (offset + 4 <= rawValue.length) {
      const id = rawValue.slice(offset, offset + 2);
      const size = Number.parseInt(rawValue.slice(offset + 2, offset + 4), 10);

      if (Number.isNaN(size) || size < 0) {
        break;
      }

      const start = offset + 4;
      const end = start + size;

      if (end > rawValue.length) {
        break;
      }

      fields.set(id, rawValue.slice(start, end));
      offset = end;
    }

    return fields;
  }

  function extractPixKeyFromPayload(payload: string): string | null {
    if (!payload) {
      return null;
    }

    const topLevelFields = parsePixTlv(payload);
    const merchantAccountInfo = topLevelFields.get("26");

    if (!merchantAccountInfo) {
      return null;
    }

    const merchantFields = parsePixTlv(merchantAccountInfo);
    const key = merchantFields.get("01");

    if (!key) {
      return null;
    }

    return key.trim();
  }

  const pixKeySuffix = computed(() => {
    const key = extractPixKeyFromPayload(pixQRCodePayload.value);

    if (!key) {
      return "não disponível";
    }

    return `...${key.slice(-4)}`;
  });

  function startPixQRCodeCountdown(): void {
    if (pixQRCodeCountdownInterval) {
      clearInterval(pixQRCodeCountdownInterval);
    }

    pixQRCodeCountdownInterval = setInterval(() => {
      pixQRCodeTimeoutSeconds.value -= 1;

      if (pixQRCodeTimeoutSeconds.value <= 0) {
        pixQRCodeExpired.value = true;
        clearInterval(pixQRCodeCountdownInterval!);
        pixQRCodeCountdownInterval = null;
        if (options.onExpired) options.onExpired();
      }
    }, 1000);
  }

  function stopPixQRCodeCountdown(): void {
    if (pixQRCodeCountdownInterval) {
      clearInterval(pixQRCodeCountdownInterval);
      pixQRCodeCountdownInterval = null;
    }
  }

  function stopPixStatusPolling(): void {
    if (pixStatusPollingInterval) {
      clearInterval(pixStatusPollingInterval);
      pixStatusPollingInterval = null;
    }
  }

  async function checkPixPaymentStatus(): Promise<void> {
    if (!pixQRCodeTxId.value) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/pix/status/${encodeURIComponent(pixQRCodeTxId.value)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        pixStatusPollingError.value = data.message || "Falha ao consultar status do Pix.";
        return;
      }

      const status = data.data?.status as string | undefined;

      if (status === "confirmed") {
        stopPixStatusPolling();
        pixStatusLabel.value = "Pagamento Pix confirmado automaticamente.";
        if (options.onAutomaticConfirm) {
          options.onAutomaticConfirm();
        }
        return;
      }

      if (status === "expired") {
        pixQRCodeExpired.value = true;
        pixStatusLabel.value = "QR Code Pix expirado.";
        stopPixStatusPolling();
        return;
      }

      if (status === "failed") {
        pixStatusPollingError.value = "Pagamento Pix não autorizado pelo provedor.";
        stopPixStatusPolling();
        return;
      }

      pixStatusLabel.value = "Aguardando confirmação do Pix...";
      pixStatusPollingError.value = null;
    } catch {
      pixStatusPollingError.value = "Não foi possível atualizar o status do Pix agora.";
    }
  }

  function startPixStatusPolling(): void {
    stopPixStatusPolling();
    pixStatusPollingError.value = null;
    pixStatusLabel.value = "Aguardando confirmação do Pix...";

    void checkPixPaymentStatus();

    pixStatusPollingInterval = setInterval(() => {
      void checkPixPaymentStatus();
    }, 3000);
  }

  async function generatePixQRCode(amountCents: number): Promise<void> {
    pixQRCodeError.value = null;
    pixQRCodeLoading.value = true;

    try {
      if (amountCents <= 0) {
        pixQRCodeError.value = "Valor do Pix não foi especificado.";
        return;
      }

      pixQRCodeTxId.value = "";

      const response = await authenticatedFetch("/api/pix/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: amountCents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        pixQRCodeError.value = data.message || "Falha ao gerar QR Code Pix.";
        return;
      }

      pixQRCodeTxId.value = typeof data.data?.tx_id === "string" ? data.data.tx_id : "";
      pixQRCodePayload.value = data.data?.qr_code_payload || "";
      pixQRCodeMerchantName.value = data.data?.merchant_name || "";

      if (!pixQRCodePayload.value.trim()) {
        pixQRCodeError.value = "Falha ao gerar QR Code Pix. Tente novamente.";
        return;
      }

      pixQRCodeTimeoutSeconds.value = 300; // 5 minutos
      pixQRCodeExpired.value = false;

      startPixQRCodeCountdown();
      startPixStatusPolling();
    } catch {
      pixQRCodeError.value = "Erro de conexão ao gerar QR Code Pix.";
    } finally {
      pixQRCodeLoading.value = false;
    }
  }

  function stopPolling() {
    stopPixQRCodeCountdown();
    stopPixStatusPolling();
  }

  return {
    pixQRCodePayload,
    pixQRCodeTxId,
    pixQRCodeMerchantName,
    pixQRCodeTimeoutSeconds,
    pixQRCodeLoading,
    pixQRCodeError,
    pixQRCodeExpired,
    pixStatusPollingError,
    pixStatusLabel,
    pixQRCodeTimeoutFormatted,
    pixKeySuffix,
    generatePixQRCode,
    stopPolling
  };
}
