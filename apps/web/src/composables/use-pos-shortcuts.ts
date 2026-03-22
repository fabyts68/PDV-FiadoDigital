import { onMounted, onUnmounted } from "vue";

export interface UsePosShortcutsOptions {
  onHelp: () => void;
  onSearchProduct: () => void;
  onPayment: () => void;
  onCashOut: () => void;
  onCashIn: () => void;
  onDeleteSelected: () => void;
  onQuantityMode: () => void;
  onEscape: () => void;
  onBarcodeScanned: (barcode: string) => void;
  getHasModalOpen: () => boolean;
}

export function usePosShortcuts(options: UsePosShortcutsOptions) {
  let scannerBuffer = "";
  let scannerTimer: ReturnType<typeof setTimeout> | null = null;

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === "F1") {
      event.preventDefault();
      options.onHelp();
      return;
    }

    if (captureScannerInput(event)) {
      return;
    }

    if (event.key === "Escape") {
      options.onEscape();
      return;
    }

    if (options.getHasModalOpen()) {
      return;
    }

    if (event.key === "F2") {
      event.preventDefault();
      options.onSearchProduct();
      return;
    }

    if (event.key === "F4") {
      event.preventDefault();
      options.onPayment();
      return;
    }

    if (event.key === "F6") {
      event.preventDefault();
      options.onCashOut();
      return;
    }

    if (event.key === "F7") {
      event.preventDefault();
      options.onCashIn();
      return;
    }

    if (event.key === "F8") {
      event.preventDefault();
      options.onDeleteSelected();
      return;
    }

    if (event.key === "F9") {
      event.preventDefault();
      options.onQuantityMode();
    }
  }

  function captureScannerInput(event: KeyboardEvent): boolean {
    if (options.getHasModalOpen()) {
      return false;
    }

    const target = event.target as HTMLElement | null;
    const tagName = (target?.tagName || "").toLowerCase();
    const isTypingContext = tagName === "input" || tagName === "textarea" || tagName === "select";

    if (isTypingContext) {
      return false;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }

    if (event.key === "Enter") {
      if (!scannerBuffer) {
        return false;
      }

      event.preventDefault();
      options.onBarcodeScanned(scannerBuffer);
      scannerBuffer = "";
      return true;
    }

    if (event.key.length !== 1) {
      return false;
    }

    scannerBuffer += event.key;

    if (scannerTimer) {
      clearTimeout(scannerTimer);
    }

    scannerTimer = setTimeout(() => {
      scannerBuffer = "";
    }, 90);

    return true;
  }

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
    if (scannerTimer) {
      clearTimeout(scannerTimer);
    }
  });
}
