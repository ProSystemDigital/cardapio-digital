import Link from "next/link";
import styles from "../../planos/planos.module.scss";

export default function SubscriptionConfirmationPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="confirmation-title">
        <p className={styles.eyebrow}>Assinatura</p>
        <h1 id="confirmation-title">Pagamento recebido para confirmação</h1>
        <p className={styles.description}>O acesso administrativo será liberado somente após a confirmação segura enviada pelo Stripe. A página de retorno não concede acesso por conta própria.</p>
        <div className={styles.actions}><Link href="/admin">Verificar acesso</Link><Link href="/login">Voltar ao início</Link></div>
      </section>
    </main>
  );
}
