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
  await page.getByRole("radio", { name: /Entrega/ }).click();
  await expect(page.getByLabel("Carrinho").getByText("Taxa de entrega")).toBeVisible();
  await expect(page.getByLabel("Carrinho").getByText("R$ 57,00")).toBeVisible();
});

test("layout não cria rolagem horizontal nas viewports suportadas", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
});

test("mobile exibe o estabelecimento e adiciona ao carrinho sem randomUUID", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/cardapio/mesa-viva");

  await expect(page.getByLabel("Mesa Viva, início").getByText("Mesa Viva", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar Burrata da casa" }).click();
  await expect(page.getByRole("button", { name: /Abrir carrinho com 1 itens/ })).toBeVisible();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  await expect(page.getByLabel("Carrinho").getByText("Burrata da casa")).toBeVisible();
});

test("resolve tenants por slug sem misturar seus produtos", async ({ page }) => {
  await page.goto("/cardapio/casa-do-porto");

  await expect(page.getByLabel("Casa do Porto, início")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Peixe grelhado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Burger Mesa Viva" })).toHaveCount(0);
  await expect(page.getByText("na mesa · retirada", { exact: true })).toBeVisible();
});

test("apresenta estado seguro para tenant inexistente", async ({ page }) => {
  const response = await page.goto("/cardapio/tenant-inexistente");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Estabelecimento não encontrado" })).toBeVisible();
});

test("a raiz redireciona para o diretório público de cardápios", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/cardapio$/);
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

test("impede modalidade incompatível e não solicita dados pessoais", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");
  await page.getByRole("button", { name: "Adicionar Burrata da casa" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();

  await page.getByRole("radio", { name: /Entrega/ }).click();
  await expect(page.getByText("Modalidade incompatível com: Burrata da casa.")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Entrega/ })).not.toBeChecked();
  await page.getByRole("radio", { name: /Retirada/ }).check();
  await expect(page.getByText("Cotação demonstrativa para retirada.")).toBeVisible();
  await expect(page.locator('input:not([type="radio"]):not([placeholder="Buscar pratos..."])')).toHaveCount(0);
});

test("tenant sem entrega expõe somente modalidades habilitadas", async ({ page }) => {
  await page.goto("/cardapio/casa-do-porto");
  await page.getByRole("button", { name: "Adicionar Água de coco" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();

  await expect(page.getByRole("radio", { name: /Na mesa/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Retirada/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Entrega/ })).toHaveCount(0);
  await expect(page.getByText(/Faltam R\$.*13,00/)).toBeVisible();
});

test("atendimento na mesa exige uma identificação configurada", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");
  await page.getByRole("button", { name: "Personalizar Burger Mesa Viva" }).click();
  await page.getByRole("checkbox", { name: /Bacon/ }).check();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  await page.getByRole("radio", { name: /Na mesa/ }).check();
  const review = page.getByRole("button", { name: "Revisar prévia" });
  await expect(review).toBeDisabled();
  await page.getByLabel("Qual é a sua mesa?").selectOption("Salão principal · Mesa 02");
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.getByRole("dialog", { name: "Prévia do pedido" }).getByText(/Mesa: Salão principal · Mesa 02/)).toBeVisible();
});

test("gera prévia local, copia com segurança e não navega externamente", async ({ page }) => {
  await page.goto("/cardapio/mesa-viva");
  await page.getByRole("button", { name: "Personalizar Burger Mesa Viva" }).click();
  await page.getByRole("checkbox", { name: /Bacon/ }).check();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.getByRole("button", { name: /Abrir carrinho com 1 itens/ }).click();
  await page.getByRole("radio", { name: /Retirada/ }).check();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as typeof window & { copiedOrder?: string }).copiedOrder = value;
        },
      },
    });
  });

  const previewButton = page.getByRole("button", { name: "Revisar prévia" });
  await previewButton.click();
  const dialog = page.getByRole("dialog", { name: "Prévia do pedido" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Prévia — pedido não enviado", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fechar prévia" })).toBeFocused();
  await expect(dialog.getByText(/Burger Mesa Viva/)).toBeVisible();
  await expect(dialog.getByText(/Total: R\$ 50,00/)).toBeVisible();
  await dialog.getByRole("button", { name: "Copiar resumo" }).click();
  await expect(dialog.getByText("Resumo copiado.")).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { copiedOrder?: string }).copiedOrder)).toContain("PEDIDO NÃO ENVIADO");
  await expect(page.locator('a[href^="http"], a[href^="https"], a[href*="wa.me"]')).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(previewButton).toBeFocused();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("clipboard bloqueado"); } },
    });
  });
  await previewButton.click();
  const errorDialog = page.getByRole("dialog", { name: "Prévia do pedido" });
  await errorDialog.getByRole("button", { name: "Copiar resumo" }).click();
  await expect(errorDialog.getByText("Não foi possível copiar. A prévia continua disponível.")).toBeVisible();
  await expect(errorDialog.getByText(/Burger Mesa Viva/)).toBeVisible();
});
