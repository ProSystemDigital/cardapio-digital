import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "./sign-out-button";
import styles from "./admin.module.scss";

export default async function AdminPage() {
  await auth.protect();

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>Ambiente administrativo</p>
        <h1 className={styles.title} id="admin-title">Sessão Clerk validada</h1>
        <p className={styles.description}>
          Esta tela comprova apenas a autenticação. O acesso ao catálogo continuará
          bloqueado até o vínculo PostgreSQL e a permissão do tenant serem derivados.
        </p>
        <p className={styles.status} role="status">Nenhum papel ou tenant foi aceito da sessão externa.</p>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}
