"use client";

import { useActionState, useState } from "react";
import type { FulfillmentMode } from "../../domain/catalog";
import {
  updateProductAvailabilityOptions,
  type ProductAvailabilityOptionsActionState,
} from "./actions";
import styles from "./admin.module.scss";

const initialState: ProductAvailabilityOptionsActionState = { status: "idle", message: "" };
const labels: Record<FulfillmentMode, string> = {
  dine_in: "Na mesa",
  pickup: "Retirada",
  delivery: "Entrega",
};
const modeOrder: readonly FulfillmentMode[] = ["pickup", "delivery", "dine_in"];

export function FulfillmentModesForm({
  productId,
  version,
  isAvailable,
  selectedModes,
}: {
  productId: string;
  version: number;
  isAvailable: boolean;
  selectedModes: readonly FulfillmentMode[];
  tenantModes: readonly FulfillmentMode[];
}) {
  const [state, action, pending] = useActionState(updateProductAvailabilityOptions, initialState);
  const [unavailable, setUnavailable] = useState(!isAvailable);
  const [modes, setModes] = useState<readonly FulfillmentMode[]>(
    isAvailable ? selectedModes : [],
  );

  function toggleMode(mode: FulfillmentMode, checked: boolean): void {
    setUnavailable(false);
    setModes((current) => checked
      ? [...new Set([...current, mode])]
      : current.filter((currentMode) => currentMode !== mode));
  }

  return (
    <form action={action} className={styles.fulfillmentModesForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <fieldset aria-label="Disponibilidade do Produto">
        <div className={styles.modeOptions}>
          <label>
            <input
              checked={unavailable}
              name="unavailable"
              onChange={(event) => {
                setUnavailable(event.currentTarget.checked);
                if (event.currentTarget.checked) setModes([]);
              }}
              type="checkbox"
              value="yes"
            />
            Não disponível
          </label>
          {modeOrder.map((mode) => (
            <label key={mode}>
              <input
                checked={!unavailable && modes.includes(mode)}
                disabled={unavailable}
                name="fulfillmentModes"
                onChange={(event) => toggleMode(mode, event.currentTarget.checked)}
                type="checkbox"
                value={mode}
              />
              {labels[mode]}
            </label>
          ))}
        </div>
      </fieldset>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar opções"}
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
