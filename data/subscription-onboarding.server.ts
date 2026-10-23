import "server-only";

import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("Banco de assinaturas indisponível.");
  pool ??= new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
  return pool;
}

export async function createSubscriptionOnboarding(input: { issuer: string; subject: string; plan: "essential" | "professional" }) {
  const result = await getPool().query<{ id: string }>(
    "SELECT public.create_subscription_onboarding($1, $2, $3) AS id",
    [input.issuer, input.subject, input.plan],
  );
  if (!result.rows[0]?.id) throw new Error("Não foi possível iniciar a assinatura.");
  return result.rows[0].id;
}

export async function attachSubscriptionCheckout(onboardingId: string, checkoutSessionId: string) {
  await getPool().query("SELECT public.attach_subscription_checkout($1, $2)", [onboardingId, checkoutSessionId]);
}

export async function activatePaidSubscription(input: { eventId: string; eventType: string; checkoutSessionId: string; customerId: string; subscriptionId: string }) {
  await getPool().query("SELECT public.activate_paid_subscription($1, $2, $3, $4, $5)", [input.eventId, input.eventType, input.checkoutSessionId, input.customerId, input.subscriptionId]);
}

export async function suspendSubscriptionAccess(input: { eventId: string; eventType: string; subscriptionId: string; status: "past_due" | "canceled" }) {
  await getPool().query("SELECT public.suspend_subscription_access($1, $2, $3, $4)", [input.eventId, input.eventType, input.subscriptionId, input.status]);
}

export async function resumeSubscriptionAccess(input: { eventId: string; eventType: string; subscriptionId: string }) {
  await getPool().query("SELECT public.resume_subscription_access($1, $2, $3)", [input.eventId, input.eventType, input.subscriptionId]);
}
