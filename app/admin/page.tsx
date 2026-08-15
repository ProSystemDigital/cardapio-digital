import { auth } from "@clerk/nextjs/server";
import { resolveCurrentIdentity } from "../../data/authentication.server";
import { SignOutButton } from "./sign-out-button";
import styles from "./admin.module.scss";

export default async function AdminPage() {
  await auth.protect();
  const identity = await resolveCurrentIdentity();

  if (identity.kind === "denied") {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <p className={styles.eyebrow}>Ambiente administrativo</p>
          <h1 className={styles.title} id="admin-title">Acesso interno indisponível</h1>
          <p className={styles.description}>
            A sessão foi autenticada, mas não possui um vínculo interno ativo.
            Nenhum tenant ou papel foi concedido.
          </p>
          <p className={styles.deniedStatus} role="status">
            Solicite ao administrador da plataforma a ativação do acesso.
          </p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>Ambiente administrativo</p>
        <h1 className={styles.title} id="admin-title">Identidade interna validada</h1>
        <p className={styles.description}>
          A sessão Clerk foi vinculada a um principal ativo no PostgreSQL. O acesso ao
          catálogo continuará bloqueado até a permissão do tenant ser derivada.
        </p>
        <p className={styles.status} role="status">Nenhum papel ou tenant foi aceito da sessão externa.</p>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}
