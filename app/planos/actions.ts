"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripeClient } from "../../data/stripe.server";
import { mapClerkAuthToExternalSession } from "../../data/clerk-session-mapper";
import { normalizeExternalIdentity } from "../../domain/authentication";
import { attachSubscriptionCheckout, createSubscriptionOnboarding } from "../../data/subscription-onboarding.server";

const priceEnvironmentByPlan = {
  essential: "STRIPE_ESSENTIAL_PRICE_ID",
  professional: "STRIPE_PROFESSIONAL_PRICE_ID",
} as const;

export async function startSubscriptionCheckout(formData: FormData) {
  const authResult = await auth.protect();
  const plan = formData.get("plan");
  if (typeof plan !== "string" || !(plan in priceEnvironmentByPlan)) {
    throw new Error("Plano de assinatura inválido.");
  }
  const environmentName = priceEnvironmentByPlan[plan as keyof typeof priceEnvironmentByPlan];
  const priceId = process.env[environmentName]?.trim();
  if (!priceId) throw new Error("Preço do plano indisponível neste ambiente.");

  const sessionIdentity = mapClerkAuthToExternalSession({
    userId: authResult.userId,
    sessionClaims: authResult.sessionClaims as Record<string, unknown> | null,
  });
  const identity = sessionIdentity ? normalizeExternalIdentity(sessionIdentity) : null;
  if (!identity) throw new Error("Identidade autenticada inválida.");
  const onboardingId = await createSubscriptionOnboarding({
    issuer: identity.issuer,
    subject: identity.subject,
    plan: plan as "essential" | "professional",
  });

  const origin = (await headers()).get("origin");
  if (!origin) throw new Error("Origem da solicitação indisponível.");

  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    client_reference_id: onboardingId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/assinatura/confirmacao?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/planos?cancelado=1`,
    integration_identifier: "mesa_viva_checkout_qxmdrsta",
  });
  if (!session.url) throw new Error("O Stripe não retornou a URL segura do checkout.");
  await attachSubscriptionCheckout(onboardingId, session.id);
  redirect(session.url);
}
