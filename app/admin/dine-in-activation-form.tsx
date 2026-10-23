"use client";

import { useActionState } from "react";
import { activateDineIn, type DineInActivationActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: DineInActivationActionState = { status: "idle", message: "" };

export function DineInActivationForm({ products }: {
  products: readonly { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(activateDineIn, initialState);
  return (
    <form action={action} className={styles.dineInActivationForm}>
      <fieldset>
        <legend>Produtos disponíveis para Na mesa</legend>
        <p>Selecione ao menos um produto. Os demais permanecerão sem essa modalidade.</p>
        <div className={styles.dineInProductOptions}>
          {products.map((product) => (
            <label key={product.id}>
              <input name="productIds" type="checkbox" value={product.id} />
              {product.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo a ativação de Na mesa para o tenant e para os produtos selecionados.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Ativando…" : "Ativar Na mesa"}
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
