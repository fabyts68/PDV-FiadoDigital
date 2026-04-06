import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePixPolling } from "../use-pix-polling.js";
import { nextTick } from "vue";

// Mock do useApi
const mockAuthenticatedFetch = vi.fn();
vi.mock("@/composables/use-api.js", () => ({
  useApi: () => ({
    authenticatedFetch: mockAuthenticatedFetch,
  }),
}));

describe("usePixPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve inicializar com estado padrão", () => {
    const { pixQRCodeLoading, pixQRCodeExpired, pixStatusLabel } = usePixPolling();
    expect(pixQRCodeLoading.value).toBe(false);
    expect(pixQRCodeExpired.value).toBe(false);
    expect(pixStatusLabel.value).toBe("Aguardando confirmação do Pix...");
  });

  it("deve gerar QR Code Pix com sucesso", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        data: {
          tx_id: "tx-123",
          qr_code_payload: "00020126360014BR.GOV.BCB.PIX0114+551199999999952040000530398654041.005802BR5915NOME RECEBEDOR6008CIDADE62070503***6304ABCD",
          merchant_name: "NOME RECEBEDOR"
        }
      })
    };
    mockAuthenticatedFetch.mockResolvedValue(mockResponse);

    const { generatePixQRCode, pixQRCodeTxId, pixQRCodePayload, pixKeySuffix } = usePixPolling();
    
    await generatePixQRCode(100);

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith("/api/pix/qrcode", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ amount_cents: 100 })
    }));

    expect(pixQRCodeTxId.value).toBe("tx-123");
    expect(pixQRCodePayload.value).toContain("BR.GOV.BCB.PIX");
    expect(pixKeySuffix.value).toBe("...9999");
  });

  it("deve tratar erro ao gerar QR Code", async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ message: "Valor inválido" })
    };
    mockAuthenticatedFetch.mockResolvedValue(mockResponse);

    const { generatePixQRCode, pixQRCodeError } = usePixPolling();
    
    await generatePixQRCode(-1);

    // Primeiro erro de validação local
    expect(pixQRCodeError.value).toBe("Valor do Pix não foi especificado.");
  });

  it("deve iniciar contagem regressiva e expirar", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        data: { tx_id: "tx-123", qr_code_payload: "valid-payload" }
      })
    };
    mockAuthenticatedFetch.mockResolvedValue(mockResponse);

    const onExpired = vi.fn();
    const { generatePixQRCode, pixQRCodeTimeoutSeconds, pixQRCodeExpired } = usePixPolling({ onExpired });
    
    await generatePixQRCode(100);
    expect(pixQRCodeTimeoutSeconds.value).toBe(300);

    // Avança 300 segundos
    vi.advanceTimersByTime(300000);
    
    expect(pixQRCodeTimeoutSeconds.value).toBe(0);
    expect(pixQRCodeExpired.value).toBe(true);
    expect(onExpired).toHaveBeenCalled();
  });

  it("deve consultar status e confirmar automaticamente", async () => {
    // 1. Mock da geração do QR Code
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { tx_id: "tx-123", qr_code_payload: "valid-payload" } })
    });

    const onAutomaticConfirm = vi.fn();
    const { generatePixQRCode, pixStatusLabel } = usePixPolling({ onAutomaticConfirm });
    
    await generatePixQRCode(100);

    // 2. Mock da consulta de status (pendente primeiro, depois confirmado)
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { status: "pending" } })
    });
    
    // Dispara o polling manualmente (advance time)
    vi.advanceTimersByTime(3000);
    await nextTick();

    expect(pixStatusLabel.value).toBe("Aguardando confirmação do Pix...");

    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { status: "confirmed" } })
    });

    vi.advanceTimersByTime(3000);
    await nextTick();

    expect(pixStatusLabel.value).toBe("Pagamento Pix confirmado automaticamente.");
    expect(onAutomaticConfirm).toHaveBeenCalled();
  });

  it("deve parar polling ao chamar stopPolling", async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { tx_id: "tx-123", qr_code_payload: "valid-payload" } })
    });

    const { generatePixQRCode, stopPolling, pixQRCodeTimeoutSeconds } = usePixPolling();
    await generatePixQRCode(100);
    
    stopPolling();
    const lastValue = pixQRCodeTimeoutSeconds.value;
    
    vi.advanceTimersByTime(10000);
    
    expect(pixQRCodeTimeoutSeconds.value).toBe(lastValue);
    expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2); // 1 qrcode + 1 status imediato
  });
});
