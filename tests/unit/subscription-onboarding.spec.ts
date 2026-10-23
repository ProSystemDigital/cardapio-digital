import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("checkout persiste intenção pseudônima antes de abrir o Stripe", () => {
  const action = read("app/planos/actions.ts");
  expect(action).toContain("normalizeExternalIdentity");
  expect(action).toContain("createSubscriptionOnboarding");
  expect(action.indexOf("createSubscriptionOnboarding")).toBeLessThan(action.indexOf("checkout.sessions.create"));
  expect(action).toContain("client_reference_id: onboardingId");
  expect(action).not.toContain("payment_method_types");
});

test("webhook verifica assinatura e não confia na página de sucesso", () => {
  const route = read("app/api/stripe/webhook/route.ts");
  const confirmation = read("app/assinatura/confirmacao/page.tsx");
  expect(route).toContain("constructEventAsync");
  expect(route).toContain("STRIPE_WEBHOOK_SECRET");
  expect(route).toContain('event.type === "checkout.session.completed"');
  expect(route).toContain('event.type === "invoice.payment_failed"');
  expect(route).toContain('event.type === "invoice.paid"');
  expect(route).toContain('event.type === "customer.subscription.deleted"');
  expect(confirmation).not.toContain("activatePaidSubscription");
});

test("migration de assinatura é transacional, idempotente e reversível", () => {
  const up = read("database/migrations/0020_subscription_onboarding.up.sql");
  const down = read("database/migrations/0020_subscription_onboarding.down.sql");
  expect(up.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(up).toContain("CREATE TABLE subscription_onboarding_intents");
  expect(up).toContain("CREATE TABLE subscription_webhook_events");
  expect(up).toContain("ON CONFLICT DO NOTHING");
  expect(up).toContain("SECURITY DEFINER");
  expect(up).toContain("FORCE ROW LEVEL SECURITY");
  expect(up).not.toMatch(/\b(email|phone|card_number|bank_account)\b/i);
  expect(down).toContain("DROP TABLE IF EXISTS subscription_onboarding_intents");
});

test("conta autenticada sem assinatura recebe caminho para planos", () => {
  const surfaces = read("app/admin/admin-surfaces.tsx");
  expect(surfaces).toContain("Assinatura necessária");
  expect(surfaces).toContain('href="/planos"');
  expect(surfaces).not.toContain("Solicite a ativação do acesso");
});
