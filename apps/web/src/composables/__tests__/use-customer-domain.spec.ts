import { describe, it, expect } from "vitest";
import { useCustomerDomain } from "../use-customer-domain.js";

describe("useCustomerDomain", () => {
  const { extractPaymentMetadata, getPaymentHistoryTypeLabel, buildWhatsAppChargeMessage } = useCustomerDomain();

  it("deve extrair metadados de pagamento completo corretamente", () => {
    const raw = { description: JSON.stringify({ type: "full", debt_before: 5000 }), debt_before_cents: 5000 };
    const metadata = extractPaymentMetadata(raw);
    expect(metadata.type).toBe("full");
    expect(metadata.debtBefore).toBe(5000);
    expect(getPaymentHistoryTypeLabel(raw)).toBe("Completo");
  });

  it("deve extrair metadados de pagamento parcial corretamente", () => {
    const raw = { description: JSON.stringify({ type: "partial" }), debt_before_cents: 5000 };
    const metadata = extractPaymentMetadata(raw);
    expect(metadata.type).toBe("partial");
    expect(getPaymentHistoryTypeLabel(raw)).toBe("Parcial");
  });

  it("deve tratar falha no parse do JSON como pagamento parcial", () => {
    const raw = { description: "invalid json", debt_before_cents: 5000 };
    const metadata = extractPaymentMetadata(raw);
    expect(metadata.type).toBe("partial");
  });

  it("deve construir mensagem de WhatsApp para vencidos (full)", () => {
    const customer = { 
      id: "1", 
      name: "João", 
      phone: "11999999999", 
      credit_limit_cents: 50000, 
      current_debt_cents: 5000, 
      payment_due_day: 1, // João vencido em um dia > 1
      is_active: true 
    };

    const message = buildWhatsAppChargeMessage({
      customer,
      chargeAmountCents: 5000,
      chargeType: "full",
      messageVencido: "Ola [NOME], voce deve [TOTAL]!",
      messageAVencer: "Ola [NOME], sua fatura de [COBRANCA] vence em [VENCIMENTO]."
    });

    // Como João vence no dia 1 e hoje é (Date()) > 1, deve ser vencido
    expect(message).toBe("Ola João, voce deve R$ 50,00!");
  });

  it("deve construir mensagem de WhatsApp para a vencer (full)", () => {
    // Definimos uma data estática para teste do a vencer
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDay = futureDate.getDate();

    const customer = { 
      id: "2", 
      name: "Maria", 
      phone: "11999999999", 
      credit_limit_cents: 50000, 
      current_debt_cents: 10000, 
      payment_due_day: futureDay,
      is_active: true 
    };

    const message = buildWhatsAppChargeMessage({
      customer,
      chargeAmountCents: 10000,
      chargeType: "full",
      messageVencido: "Vencido!",
      messageAVencer: "Ola Maria, sua fatura de [COBRANCA] vence em [VENCIMENTO]."
    });

    expect(message).toContain(`vence em todo dia ${futureDay}`);
  });
});
