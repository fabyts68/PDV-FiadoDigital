import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePosShortcuts } from "../use-pos-shortcuts.js";

describe("usePosShortcuts", () => {
  const options = {
    onHelp: vi.fn(),
    onSearchProduct: vi.fn(),
    onPayment: vi.fn(),
    onCashOut: vi.fn(),
    onCashIn: vi.fn(),
    onDeleteSelected: vi.fn(),
    onQuantityMode: vi.fn(),
    onEscape: vi.fn(),
    onBarcodeScanned: vi.fn(),
    getHasModalOpen: vi.fn().mockReturnValue(false),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve disparar ajuda ao pressionar F1", () => {
    usePosShortcuts(options);
    const event = new KeyboardEvent("keydown", { key: "F1" });
    window.dispatchEvent(event);
    expect(options.onHelp).toHaveBeenCalled();
  });

  it("deve disparar busca de produtos ao pressionar F2 se nenhum modal estiver aberto", () => {
    usePosShortcuts(options);
    const event = new KeyboardEvent("keydown", { key: "F2" });
    window.dispatchEvent(event);
    expect(options.onSearchProduct).toHaveBeenCalled();
  });

  it("não deve disparar busca de produtos ao pressionar F2 se houver modal aberto", () => {
    options.getHasModalOpen.mockReturnValueOnce(true);
    usePosShortcuts(options);
    const event = new KeyboardEvent("keydown", { key: "F2" });
    window.dispatchEvent(event);
    expect(options.onSearchProduct).not.toHaveBeenCalled();
  });

  it("deve capturar entrada de código de barras", () => {
    usePosShortcuts(options);
    
    // Simula leitura rápida de scanner (caracteres seguidos por Enter)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "7" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "8" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "9" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(options.onBarcodeScanned).toHaveBeenCalledWith("789");
  });

  it("não deve disparar barcode scanner se estiver digitando em um input", () => {
    usePosShortcuts(options);
    
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", { key: "5", bubbles: true });
    input.dispatchEvent(event);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(options.onBarcodeScanned).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("deve limpar o buffer do scanner se houver atraso entre as teclas", () => {
    usePosShortcuts(options);
    
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    
    // Aguarda mais de 90ms (tempo de limpeza do buffer no composable)
    vi.advanceTimersByTime(100);
    
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(options.onBarcodeScanned).not.toHaveBeenCalled();
  });
});
