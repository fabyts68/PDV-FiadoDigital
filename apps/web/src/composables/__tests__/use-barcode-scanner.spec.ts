import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBarcodeScanner } from "../use-barcode-scanner.js";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

// Mock do @zxing/browser
vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeFromConstraints: vi.fn(),
  })),
}));

describe("useBarcodeScanner", () => {
  const onScan = vi.fn();
  let videoElement: HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    videoElement = document.createElement("video");
    
    // Mock global window properties
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });
  });

  it("deve inicializar com estado padrão", () => {
    const { isScanning, cameraError } = useBarcodeScanner({ onScan });
    expect(isScanning.value).toBe(false);
    expect(cameraError.value).toBe(null);
  });

  it("deve falhar se não for contexto seguro (HTTPS)", async () => {
    Object.defineProperty(window, "isSecureContext", { value: false });
    const { startScanning, cameraError, isScanning } = useBarcodeScanner({ onScan });

    await startScanning(videoElement);

    expect(isScanning.value).toBe(false);
    expect(cameraError.value).toContain("HTTPS");
  });

  it("deve iniciar o scanner com sucesso", async () => {
    const mockStop = vi.fn();
    const mockDecode = vi.fn().mockResolvedValue({ stop: mockStop });
    
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: mockDecode,
    }));

    const { startScanning, isScanning } = useBarcodeScanner({ onScan });

    await startScanning(videoElement);

    expect(isScanning.value).toBe(true);
    expect(mockDecode).toHaveBeenCalled();
  });

  it("deve tratar erro de permissão negada", async () => {
    const error = new Error("NotAllowedError");
    error.name = "NotAllowedError";
    
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: vi.fn().mockRejectedValue(error),
    }));

    const { startScanning, cameraError } = useBarcodeScanner({ onScan });

    await startScanning(videoElement);

    expect(cameraError.value).toContain("Permissão de câmera negada");
  });

  it("deve tratar erro de câmera não encontrada", async () => {
    const error = new Error("NotFoundError");
    error.name = "NotFoundError";
    
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: vi.fn().mockRejectedValue(error),
    }));

    const { startScanning, cameraError } = useBarcodeScanner({ onScan });

    await startScanning(videoElement);

    expect(cameraError.value).toContain("Nenhuma câmera encontrada");
  });

  it("deve parar o scanner corretamente", async () => {
    const mockStop = vi.fn();
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: vi.fn().mockResolvedValue({ stop: mockStop }),
    }));

    const { startScanning, stopScanning, isScanning } = useBarcodeScanner({ onScan });

    await startScanning(videoElement);
    stopScanning();

    expect(isScanning.value).toBe(false);
    expect(mockStop).toHaveBeenCalled();
  });

  it("deve ignorar NotFoundException no callback de scan", async () => {
    let capturedCallback: any;
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: vi.fn().mockImplementation((_c, _v, cb) => {
        capturedCallback = cb;
        return Promise.resolve({ stop: vi.fn() });
      }),
    }));

    const { startScanning, cameraError } = useBarcodeScanner({ onScan });
    await startScanning(videoElement);

    // Simula erro NotFoundException (comum durante a busca)
    capturedCallback(null, new NotFoundException());

    expect(cameraError.value).toBe(null);
    expect(onScan).not.toHaveBeenCalled();
  });

  it("deve chamar onScan quando um código for lido", async () => {
    let capturedCallback: any;
    (BrowserMultiFormatReader as any).mockImplementation(() => ({
      decodeFromConstraints: vi.fn().mockImplementation((_c, _v, cb) => {
        capturedCallback = cb;
        return Promise.resolve({ stop: vi.fn() });
      }),
    }));

    const { startScanning } = useBarcodeScanner({ onScan });
    await startScanning(videoElement);

    const mockResult = { getText: () => "123456789" };
    capturedCallback(mockResult, null);

    expect(onScan).toHaveBeenCalledWith("123456789");
  });
});
