"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import styles from "./admin.module.scss";

export function SignOutButton() {
  const { sessionId } = useAuth();
  const { signOut } = useClerk();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    if (!sessionId || isPending) return;

    setIsPending(true);
    setErrorMessage(null);

    try {
      await signOut({ sessionId, redirectUrl: "/admin/sign-in" });
    } catch {
      setErrorMessage("Não foi possível encerrar a sessão. Tente novamente.");
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        className={styles.button}
        type="button"
        disabled={!sessionId || isPending}
        onClick={handleSignOut}
      >
        {isPending ? "Encerrando sessão…" : "Sair com segurança"}
      </button>
      {errorMessage ? (
        <p className={styles.actionError} role="alert">{errorMessage}</p>
      ) : null}
    </div>
  );
}
