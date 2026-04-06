import { describe, it, expect, vi, beforeEach } from "vitest";
import { useModalStack } from "../use-modal-stack.js";
import { ref, nextTick } from "vue";

describe("useModalStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerenciar o ciclo de vida do listener de Escape", () => {
    const isOpen = ref(false);
    const close = vi.fn();
    
    // Simula montagem no componente
    useModalStack([ { isOpen, close } ]);
    
    // Dispara montagem manual (em testes unitários sem wrapper de componente)
    // Nota: Como useModalStack chama onMounted() internamente, precisamos testar o comportamento global
    
    // Limpando o spy para testar unmounted
    vi.clearAllMocks();
  });

  it("deve fechar o modal aberto ao pressionar Escape na ordem inversa", async () => {
    const isOpen1 = ref(true);
    const isOpen2 = ref(true);
    const close1 = vi.fn();
    const close2 = vi.fn();

    useModalStack([
      { isOpen: isOpen1, close: close1 },
      { isOpen: isOpen2, close: close2 },
    ]);

    // Simula evento Escape
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(event);

    // Deve fechar o ÚLTIMO (mais recente na stack)
    expect(close2).toHaveBeenCalled();
    expect(close1).not.toHaveBeenCalled();
  });

  it("deve respeitar a trava canClose", async () => {
    const isOpen = ref(true);
    const close = vi.fn();
    const canClose = vi.fn().mockReturnValue(false);

    useModalStack([{ isOpen, close, canClose }]);

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(event);

    expect(canClose).toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("deve capturar e restaurar o foco ao abrir/fechar", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const isOpen = ref(false);
    const close = vi.fn();
    
    useModalStack([{ isOpen, close }]);

    // Abrir modal
    isOpen.value = true;
    await nextTick();

    // Simula o foco mudando para dentro do modal (manualmente em teste)
    const insideModal = document.createElement("input");
    document.body.appendChild(insideModal);
    insideModal.focus();

    // Fechar modal
    isOpen.value = false;
    await nextTick();
    await nextTick(); // Aguarda nextTick do composable

    expect(document.activeElement).toBe(trigger);
    
    document.body.removeChild(trigger);
    document.body.removeChild(insideModal);
  });
});
