import { expect, test } from "@playwright/test";

test("PWA registra o service worker e oferece fallback offline", async ({ context, page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const serviceWorkerUrl = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("Service Worker não suportado.");
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL ?? "";
  });
  expect(serviceWorkerUrl).toMatch(/\/sw\.js$/);

  const response = await page.request.get("/manifest.json");
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as { background_color?: string; theme_color?: string; display?: string; icons?: Array<{ src: string; purpose?: string; sizes?: string }> };
  expect(manifest).toMatchObject({ background_color: "#f7f5ef", theme_color: "#10261d", display: "standalone" });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: "192x192", purpose: "any" }),
    expect.objectContaining({ sizes: "512x512", purpose: "any" }),
    expect.objectContaining({ sizes: "192x192", purpose: "maskable" }),
    expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
  ]));

  const workerResponse = await page.request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(await workerResponse.text()).toContain("/~offline");

  await context.setOffline(true);
  await page.goto("/rota-indisponivel-no-cache", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Você está sem conexão" })).toBeVisible();
  await context.setOffline(false);
});
