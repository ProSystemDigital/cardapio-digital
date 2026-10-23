import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY não está configurada.");
}

const stripe = new Stripe(secretKey, { apiVersion: "2026-09-30.endive" });

const plans = [
  {
    key: "essential",
    name: "Mesa Viva Essencial",
    description: "Gestão essencial do estabelecimento e do cardápio digital.",
    amountInCents: 15_000,
  },
  {
    key: "professional",
    name: "Mesa Viva Profissional",
    description: "Gestão profissional do estabelecimento e do cardápio digital.",
    amountInCents: 25_000,
  },
];

for (const plan of plans) {
  const lookupKey = `mesa_viva_${plan.key}_monthly_brl`;
  const existingPrices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  let price = existingPrices.data[0];

  if (!price) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { application: "mesa-viva", plan_key: plan.key },
    });

    price = await stripe.prices.create({
      product: product.id,
      currency: "brl",
      unit_amount: plan.amountInCents,
      recurring: { interval: "month" },
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      metadata: { application: "mesa-viva", plan_key: plan.key },
    });
  }

  process.stdout.write(`${plan.key.toUpperCase()}_PRICE_ID=${price.id}\n`);
}
