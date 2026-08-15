"use client";

import { useActionState } from "react";
import {
  updateProductAvailability,
  type AvailabilityActionState,
} from "./actions";
import styles from "./admin.module.scss";

const initialState: AvailabilityActionState = { status: "idle", message: "" };

export function AvailabilityForm({
  productId,
  version,
  isAvailable,
}: {
  productId: string;
  version: number;
  isAvailable: boolean;
}) {
  const [state, action, pending] = useActionState(updateProductAvailability, initialState);
  const targetLabel = isAvailable ? "Marcar como indisponível" : "Marcar como disponível";

  return (
    <form action={action} className={styles.availabilityForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <input name="isAvailable" type="hidden" value={String(!isAvailable)} />
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo a alteração de disponibilidade deste produto.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : targetLabel}
      </button>
      {state.message ? (
        <p
          className={state.status === "error" ? styles.actionError : styles.actionSuccess}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
