import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { startSubscriptionCheckout } from "./actions";
import { SubscriptionButton } from "./subscription-button";
import styles from "./planos.module.scss";

export const metadata = { title: "Planos | Mesa Viva", description: "Escolha o plano do seu estabelecimento." };

const plans = [
  { key: "essential", name: "Essencial", price: "R$ 150", capabilities: ["Identidade do estabelecimento", "Categorias e produtos", "Cardápio público"] },
  { key: "professional", name: "Profissional", price: "R$ 250", capabilities: ["Todos os recursos do Essencial", "Configurações operacionais", "Gestão ampliada do catálogo"] },
] as const;

export default async function PlansPage() {
  const { userId } = await auth();
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="plans-title">
        <p className={styles.eyebrow}>Para estabelecimentos</p>
        <h1 id="plans-title">Planos de assinatura</h1>
        <p className={styles.description}>Crie sua conta, escolha o plano e conclua o pagamento seguro pelo Stripe. O painel só é liberado após confirmação da assinatura.</p>
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <section className={styles.plan} aria-labelledby={`${plan.key}-title`} key={plan.key}>
              <span>Mensal</span>
              <h2 id={`${plan.key}-title`}>{plan.name}</h2>
              <p className={styles.price}>{plan.price}<small>/mês</small></p>
              <ul>{plan.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
              {userId ? (
                <form action={startSubscriptionCheckout}>
                  <input name="plan" type="hidden" value={plan.key} />
                  <SubscriptionButton>Assinar {plan.name}</SubscriptionButton>
                </form>
              ) : <Link className={styles.subscribeLink} href={`/admin/sign-up?plan=${plan.key}`}>Cadastrar e assinar</Link>}
            </section>
          ))}
        </div>
        <div className={styles.actions}><Link href="/login">Voltar ao primeiro acesso</Link><Link href="/admin/sign-in">Já sou assinante</Link></div>
      </section>
    </main>
  );
}
