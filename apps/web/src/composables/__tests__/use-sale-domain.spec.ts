import { describe, it, expect, vi } from "vitest";
import { useSaleDomain, type PaymentMethodRow } from "../use-sale-domain.js";

describe("useSaleDomain", () => {
  const { resolvePaymentMethod, requestReceiptPrint } = useSaleDomain();

  it("deve resolver pagamento único corretamente", () => {
    const rows: PaymentMethodRow[] = [{ method: "cash" }];
    const res = resolvePaymentMethod(rows, "misto");
    expect(res).toBe("cash");
  });

  it("deve resolver pagamento misto se houver múltiplos métodos", () => {
    const rows: PaymentMethodRow[] = [{ method: "cash" }, { method: "pix" }];
    const res = resolvePaymentMethod(rows, "misto");
    expect(res).toBe("misto");
  });

  it("deve retornar o default se não houver métodos", () => {
    const rows: any[] = [];
    const res = resolvePaymentMethod(rows, "misto");
    expect(res).toBe("misto");
  });

  it("deve acionar fallback de impressão se automatica falhar", async () => {
    const onFallbackVisible = vi.fn();
    const mockPrint = vi.fn();
    window.print = mockPrint;

    const result = await requestReceiptPrint({ id: "1" }, onFallbackVisible);

    expect(onFallbackVisible).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    expect(result.usedFallback).toBe(true);
  });
});
