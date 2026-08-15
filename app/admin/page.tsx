import { auth } from "@clerk/nextjs/server";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";
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

  const tenantAccess = await resolveCurrentTenantAccess(identity.identity);
  if (tenantAccess.length !== 1) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} aria-labelledby="admin-title">
          <p className={styles.eyebrow}>Ambiente administrativo</p>
          <h1 className={styles.title} id="admin-title">Tenant administrativo indisponível</h1>
          <p className={styles.description}>
            A identidade interna está ativa, mas não possui exatamente uma membership
            de tenant disponível para este gate controlado.
          </p>
          <p className={styles.deniedStatus} role="status">
            Nenhum acesso ao catálogo foi concedido.
          </p>
          <div className={styles.actions}><SignOutButton /></div>
        </section>
      </main>
    );
  }

  const roleLabel = tenantAccess[0].role === "owner" ? "Proprietário" : "Gerente";

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>Ambiente administrativo</p>
        <h1 className={styles.title} id="admin-title">Acesso administrativo derivado</h1>
        <p className={styles.description}>
          A sessão Clerk foi vinculada a um principal ativo e a membership foi derivada
          exclusivamente do PostgreSQL.
        </p>
        <p className={styles.status} role="status">
          Tenant autorizado: 1. Papel interno: {roleLabel}. Nenhum claim externo foi aceito.
        </p>
        <div className={styles.actions}><SignOutButton /></div>
      </section>
    </main>
  );
}
