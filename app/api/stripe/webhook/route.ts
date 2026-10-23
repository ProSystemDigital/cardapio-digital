import type Stripe from "stripe";
import { getStripeClient } from "../../../../data/stripe.server";
import { activatePaidSubscription, resumeSubscriptionAccess, suspendSubscriptionAccess } from "../../../../data/subscription-onboarding.server";

function resourceId(value: string | { id: string } | null): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return resourceId(invoice.parent?.subscription_details?.subscription ?? null);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) return new Response("Webhook indisponível", { status: 503 });

  let event: Stripe.Event;
  try {
    event = await getStripeClient().webhooks.constructEventAsync(await request.text(), signature, webhookSecret);
  } catch {
    return new Response("Assinatura inválida", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const customerId = resourceId(session.customer);
      const subscriptionId = resourceId(session.subscription);
      if (session.payment_status !== "unpaid" && customerId && subscriptionId) {
        await activatePaidSubscription({ eventId: event.id, eventType: event.type, checkoutSessionId: session.id, customerId, subscriptionId });
      }
    } else if (event.type === "invoice.paid") {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      if (subscriptionId) await resumeSubscriptionAccess({ eventId: event.id, eventType: event.type, subscriptionId });
    } else if (event.type === "invoice.payment_failed") {
      const subscriptionId = invoiceSubscriptionId(event.data.object);
      if (subscriptionId) await suspendSubscriptionAccess({ eventId: event.id, eventType: event.type, subscriptionId, status: "past_due" });
    } else if (event.type === "customer.subscription.deleted") {
      await suspendSubscriptionAccess({ eventId: event.id, eventType: event.type, subscriptionId: event.data.object.id, status: "canceled" });
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      if (!["active", "trialing"].includes(subscription.status)) {
        await suspendSubscriptionAccess({ eventId: event.id, eventType: event.type, subscriptionId: subscription.id, status: subscription.status === "canceled" ? "canceled" : "past_due" });
      }
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response("Falha temporária", { status: 500 });
  }
}
