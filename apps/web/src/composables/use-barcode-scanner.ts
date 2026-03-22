import { ref } from "vue";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export interface UseBarcodeScannerOptions {
  onScan: (text: string) => void;
}

export function useBarcodeScanner(options: UseBarcodeScannerOptions) {
  const isScanning = ref(false);
  const cameraError = ref<string | null>(null);

  let codeReader: BrowserMultiFormatReader | null = null;
  let scannerControls: IScannerControls | null = null;

  async function startScanning(videoElement: HTMLVideoElement) {
    cameraError.value = null;

    if (!window.isSecureContext) {
      isScanning.value = false;
      cameraError.value = "Câmera bloqueada: a página precisa ser acessada via HTTPS. Contate o administrador do sistema.";
      return;
    }

    type ScanCallback = Parameters<BrowserMultiFormatReader["decodeFromConstraints"]>[2];
    const scanCallback: ScanCallback = (result, error) => {
      if (result) {
        options.onScan(result.getText());
        return;
      }
      if (error && !(error instanceof NotFoundException)) {
        cameraError.value = "Erro ao processar imagem da câmera.";
      }
    };

    try {
      codeReader = new BrowserMultiFormatReader();
      isScanning.value = true;

      scannerControls = await codeReader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoElement,
        scanCallback,
      );
    } catch (error) {
      isScanning.value = false;

      if (!(error instanceof Error)) {
        cameraError.value = "Não foi possível acessar a câmera.";
        return;
      }

      if (error.name === "NotAllowedError") {
        cameraError.value = "Permissão de câmera negada. Verifique as configurações do navegador.";
        return;
      }

      if (error.name === "NotFoundError") {
        cameraError.value = "Nenhuma câmera encontrada neste dispositivo.";
        return;
      }

      if (error.name === "SecurityError") {
        cameraError.value = "Câmera bloqueada por política de segurança. Acesse o sistema via HTTPS.";
        return;
      }

      if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        try {
          codeReader = new BrowserMultiFormatReader();
          isScanning.value = true;
          scannerControls = await codeReader.decodeFromConstraints(
            { video: true },
            videoElement,
            scanCallback,
          );
        } catch {
          isScanning.value = false;
          cameraError.value = "Câmera incompatível com este dispositivo.";
        }
        return;
      }

      cameraError.value = "Não foi possível acessar a câmera.";
    }
  }

  function stopScanning() {
    scannerControls?.stop();
    scannerControls = null;
    codeReader = null;
    isScanning.value = false;
  }

  return {
    isScanning,
    cameraError,
    startScanning,
    stopScanning
  };
}
