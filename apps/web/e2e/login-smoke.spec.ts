import { expect, test } from "@playwright/test";

test("renderiza tela de login", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "PDV Digital" })).toBeVisible();
  await expect(page.getByLabel("Usuário")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
