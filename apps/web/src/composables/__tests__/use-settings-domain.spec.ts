import { describe, it, expect } from "vitest";
import { useSettingsDomain } from "../use-settings-domain.js";

describe("useSettingsDomain", () => {
  const { validatePixKey, parseRateInput, sanitizePixKeyInput } = useSettingsDomain();

  it("deve validar CPF corretamente", () => {
    // CPFs validos (gerados/mockados)
    expect(validatePixKey("cpf", "111.444.777-05")).toBeUndefined();
    expect(validatePixKey("cpf", "12345678901")).toContain("Informe um CPF valido");
  });

  it("deve validar CNPJ corretamente", () => {
    expect(validatePixKey("cnpj", "12.345.678/0001-95")).toBeUndefined();
    expect(validatePixKey("cnpj", "12345678000195")).toBeUndefined();
    expect(validatePixKey("cnpj", "11111111111111")).toContain("Informe um CNPJ valido");
  });

  it("deve validar e-mail corretamente", () => {
    expect(validatePixKey("email", "test@example.com")).toBeUndefined();
    expect(validatePixKey("email", "invalid-email")).toContain("Informe um e-mail valido");
  });

  it("deve validar telefone corretamente", () => {
    expect(validatePixKey("phone", "11988887777")).toBeUndefined();
    expect(validatePixKey("phone", "1198888777")).toContain("Informe um telefone valido");
  });

  it("deve validar chave aleatória (UUID v4) corretamente", () => {
    expect(validatePixKey("random", "550e8400-e29b-41d4-a716-446655440000")).toContain("Informe uma chave aleatoria valida");
    // UUID v4 precisa de "4" na versao
    expect(validatePixKey("random", "f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBeUndefined();
  });

  it("deve limpar input de taxa corretamente", () => {
    expect(parseRateInput("5,5")).toBe(5.5);
    expect(parseRateInput("10.75 ")).toBe(10.75);
    expect(parseRateInput("101")).toBe(null);
    expect(parseRateInput("-1")).toBe(null);
    expect(parseRateInput("abc")).toBe(null);
  });

  it("deve higienizar entrada de chave Pix conforme tipo", () => {
    expect(sanitizePixKeyInput("cpf", " 111.222.333-44 ")).toBe("11122233344");
    expect(sanitizePixKeyInput("email", " user@example.com ")).toBe("user@example.com");
  });
});
