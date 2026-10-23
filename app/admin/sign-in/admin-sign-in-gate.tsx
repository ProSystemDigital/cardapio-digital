"use client";

import { SignIn, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { SignOutButton } from "../sign-out-button";
import styles from "../admin.module.scss";

export function AdminSignInGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();

  if (!isLoaded || (isSignedIn && !isUserLoaded)) {
    return <p role="status">Verificando a sessão...</p>;
  }

  const accountName = user?.fullName || user?.username || "Conta conectada";
  const accountEmail = user?.primaryEmailAddress?.emailAddress;

  if (!isSignedIn) {
    return (
      <SignIn
        path="/admin/sign-in"
        routing="path"
        fallbackRedirectUrl="/admin"
      />
    );
  }

  return (
    <section className={styles.activeSession} aria-labelledby="active-session-title">
      <h2 id="active-session-title">Uma conta administrativa já está conectada</h2>
      <p>
        Continue somente se esta for a conta do assinante ou administrador correto.
        Para digitar outro login e senha, encerre primeiro a sessão atual.
      </p>
      <dl className={styles.activeAccount} aria-label="Conta conectada atualmente">
        <div>
          <dt>Conta atual</dt>
          <dd>{accountName}</dd>
        </div>
        {accountEmail ? (
          <div>
            <dt>E-mail</dt>
            <dd>{accountEmail}</dd>
          </div>
        ) : null}
      </dl>
      <div className={styles.activeSessionActions}>
        <Link className={styles.button} href="/admin">Continuar com esta conta</Link>
        <SignOutButton label="Entrar com outra conta" redirectUrl="/admin/sign-in" />
      </div>
    </section>
  );
}
