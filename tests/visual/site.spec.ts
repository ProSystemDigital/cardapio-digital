import { expect, test } from "@playwright/test";

test("cardápio permite filtrar, buscar e montar o carrinho", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("prato favorito");
  await expect(page.getByRole("heading", { name: "Nosso cardápio" })).toBeVisible();

  await page.getByRole("button", { name: "Bebidas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Limonada de capim-santo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Burger Mesa Viva" })).toBeHidden();

  await page.getByPlaceholder("Buscar pratos...").fill("mate");
  await expect(page.getByRole("heading", { name: "Chá mate cítrico" })).toBeVisible();

  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await page.getByPlaceholder("Buscar pratos...").fill("");
  await page.getByRole("button", { name: "Personalizar Burger Mesa Viva" }).click();
  await expect(page.getByRole("dialog", { name: "Burger Mesa Viva" })).toBeVisible();
  await page.getByRole("checkbox", { name: /Bacon/ }).check();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  await expect(page.getByLabel("Carrinho").getByText("Burger Mesa Viva")).toBeVisible();
  await expect(page.getByLabel("Carrinho").getByText("Bacon", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Carrinho").getByText("R$ 50,00 cada")).toBeVisible();
});

test("layout não cria rolagem horizontal nas viewports suportadas", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
});

test("resolve tenants por slug sem misturar seus produtos", async ({ page }) => {
  await page.goto("/cardapio/casa-do-porto");

  await expect(page.getByLabel("Casa do Porto, início")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Peixe grelhado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Burger Mesa Viva" })).toHaveCount(0);
  await expect(page.getByText("mesa · retirada", { exact: true })).toBeVisible();
});

test("apresenta estado seguro para tenant inexistente", async ({ page }) => {
  const response = await page.goto("/cardapio/tenant-inexistente");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Estabelecimento não encontrado" })).toBeVisible();
});

test("a raiz redireciona para o catálogo demonstrativo padrão", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/cardapio\/mesa-viva$/);
});

test("personaliza, valida e edita uma linha sem aceitar preço da interface", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");

  await page.getByRole("button", { name: "Personalizar Nhoque verde" }).click();
  const dialog = page.getByRole("dialog", { name: "Nhoque verde" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fechar personalização" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Personalizar Nhoque verde" })).toBeFocused();
  await page.getByRole("button", { name: "Personalizar Nhoque verde" }).click();
  await dialog.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Selecione uma variação");
  await dialog.getByRole("radio", { name: /Para dois/ }).check();
  await dialog.getByRole("button", { name: "Adicionar ao carrinho" }).click();

  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  const cart = page.getByLabel("Carrinho");
  await expect(cart.getByText("R$ 98,00 cada")).toBeVisible();
  await cart.getByRole("button", { name: /Editar/ }).click();
  const editDialog = page.getByRole("dialog", { name: "Nhoque verde" });
  await editDialog.getByRole("radio", { name: /Individual/ }).check();
  await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(cart.getByText("R$ 56,00 cada")).toBeVisible();
});
