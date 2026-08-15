"use client";

import { useActionState } from "react";
import { updateProductPrice, type PriceActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: PriceActionState = { status: "idle", message: "" };

export function PriceForm({
  productId,
  version,
  priceInCents,
}: {
  productId: string;
  version: number;
  priceInCents: number;
}) {
  const [state, action, pending] = useActionState(updateProductPrice, initialState);

  return (
    <form action={action} className={styles.priceForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <label className={styles.priceField}>
        Novo preço em reais
        <span className={styles.priceInput}>
          <span aria-hidden="true">R$</span>
          <input
            defaultValue={(priceInCents / 100).toFixed(2)}
            inputMode="decimal"
            maxLength={9}
            name="price"
            pattern="\d{1,6}(?:[.,]\d{1,2})?"
            required
            type="text"
          />
        </span>
      </label>
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo o novo preço deste produto.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar novo preço"}
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
