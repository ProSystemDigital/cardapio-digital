"use client";

import { useActionState } from "react";
import { updateProductContent, type ContentActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: ContentActionState = { status: "idle", message: "" };

export function ContentForm({
  productId,
  version,
  name,
  description,
}: {
  productId: string;
  version: number;
  name: string;
  description: string;
}) {
  const [state, action, pending] = useActionState(updateProductContent, initialState);

  return (
    <form action={action} className={styles.contentForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <label className={styles.contentField}>
        Nome do produto
        <input defaultValue={name} maxLength={120} name="name" required type="text" />
      </label>
      <label className={styles.contentField}>
        Descrição pública
        <textarea defaultValue={description} maxLength={500} name="description" rows={3} />
      </label>
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo o novo nome e a nova descrição deste produto.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar conteúdo"}
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
