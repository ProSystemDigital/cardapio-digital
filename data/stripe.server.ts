import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Stripe indisponível neste ambiente.");
  stripeClient ??= new Stripe(secretKey, { apiVersion: "2026-09-30.endive" });
  return stripeClient;
}
