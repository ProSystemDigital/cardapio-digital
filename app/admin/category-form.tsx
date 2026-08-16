"use client";

import { useActionState } from "react";
import { updateProductCategory, type CategoryActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: CategoryActionState = { status: "idle", message: "" };

type CategoryOption = { id: string; name: string };

export function CategoryForm({
  productId,
  version,
  categoryId,
  categories,
}: {
  productId: string;
  version: number;
  categoryId: string;
  categories: readonly CategoryOption[];
}) {
  const [state, action, pending] = useActionState(updateProductCategory, initialState);

  return (
    <form action={action} className={styles.categoryForm}>
      <input name="productId" type="hidden" value={productId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <label className={styles.contentField}>
        Categoria do produto
        <select defaultValue={categoryId} name="categoryId" required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className={styles.confirmation}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo a classificação deste produto na categoria selecionada.
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar categoria"}
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
