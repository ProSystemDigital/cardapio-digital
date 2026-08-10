import { expect, test } from "@playwright/test";

test("cardápio permite filtrar, buscar e montar o carrinho", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("prato favorito");
  await expect(page.getByRole("heading", { name: "Nosso cardápio" })).toBeVisible();

  await page.getByRole("button", { name: "Bebidas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Limonada de capim-santo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Burger Mesa Viva" })).toBeHidden();

  await page.getByPlaceholder("Buscar pratos...").fill("mate");
  await expect(page.getByRole("heading", { name: "Chá mate cítrico" })).toBeVisible();

  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await page.getByPlaceholder("Buscar pratos...").fill("");
  await page.getByRole("button", { name: "Adicionar Burger Mesa Viva ao carrinho" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  await expect(page.getByLabel("Carrinho").getByText("Burger Mesa Viva")).toBeVisible();
  await expect(page.getByLabel("Carrinho").getByText("R$ 44,00").last()).toBeVisible();
});

test("layout não cria rolagem horizontal nas viewports suportadas", async ({ page }) => {
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
});
