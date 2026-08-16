"use client";

import { useActionState } from "react";
import type { FulfillmentMode } from "../../domain/catalog";
import {
  updateProductFulfillmentModes,
  type FulfillmentModesActionState,
} from "./actions";
import styles from "./admin.module.scss";

const initialState: FulfillmentModesActionState = { status: "idle", message: "" };
const labels: Record<FulfillmentMode, string> = {
  dine_in: "Consumo em mesa",
  pickup: "Retirada",
  delivery: "Entrega",
};

export function FulfillmentModesForm({
  productId,
  version,
  selectedModes,
  tenantModes,
}: {
  productId: string;
  version: number;
  selectedModes: readonly FulfillmentMode[];
  tenantModes: readonly FulfillmentMode[];
}) {
  const [state, action, pending] = useActionState(updateProductFulfillmentModes, initialState);

  return (
    <form action={action} className={styles.fulfillmentModesForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <fieldset>
        <legend>Modalidades do produto</legend>
        <div className={styles.modeOptions}>
          {tenantModes.map((mode) => (
            <label key={mode}>
              <input
                defaultChecked={selectedModes.includes(mode)}
                name="fulfillmentModes"
                type="checkbox"
                value={mode}
              />
              {labels[mode]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo que o produto manterá ao menos uma modalidade de atendimento.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar modalidades"}
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
