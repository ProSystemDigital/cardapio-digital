import styles from "../../admin.module.scss";
import { AdminSignInGate } from "../admin-sign-in-gate";
import Link from "next/link";

export default function AdminSignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.signIn} aria-label="Acesso administrativo">
        <header>
          <p>Acesso restrito</p>
          <h1>Assinante ou administrador</h1>
          <p>Clientes do estabelecimento não precisam entrar para consultar o cardápio.</p>
        </header>
        <AdminSignInGate />
        <p className={styles.signUpInvitation}>Ainda não possui assinatura? <Link href="/planos">Cadastre-se e escolha um plano</Link></p>
      </section>
    </main>
  );
}
