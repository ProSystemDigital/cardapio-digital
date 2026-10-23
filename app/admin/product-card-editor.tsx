"use client";

import { useActionState, useState } from "react";
import type { EditableProduct } from "./product-creation-form";
import { useProductManagementWorkspace } from "./product-management-workspace";
import { updateProductManagement, type ProductManagementActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: ProductManagementActionState = { status: "idle", message: "" };

type ProductCardEditorProps = {
  product: EditableProduct;
};

export function ProductCardEditor({ product }: ProductCardEditorProps) {
  const { beginEdit, selectedProduct } = useProductManagementWorkspace();
  const isEditing = selectedProduct?.id === product.id;
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [state, archiveAction, pending] = useActionState(async (previousState: ProductManagementActionState, formData: FormData) => {
    const nextState = await updateProductManagement(previousState, formData);
    if (nextState.status === "success") setConfirmingArchive(false);
    return nextState;
  }, initialState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPinned, setMenuPinned] = useState(false);

  return (
    <div className={styles.productCardEditor}>
      <details
        className={styles.productActionsMenu}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setMenuOpen(false);
            setMenuPinned(false);
          }
        }}
        onFocus={() => setMenuOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMenuOpen(false);
            setMenuPinned(false);
          }
        }}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => { if (!menuPinned) setMenuOpen(false); }}
        open={menuOpen}
      >
        <summary
          aria-expanded={menuOpen}
          aria-label={`Abrir ações de ${product.name}`}
          onClick={(event) => {
            event.preventDefault();
            setMenuPinned((pinned) => {
              const nextPinned = !pinned;
              setMenuOpen(nextPinned);
              return nextPinned;
            });
          }}
        >⋮</summary>
        <div aria-label={`Ações de ${product.name}`} className={styles.productActionsMenuItems}>
          <button aria-current={isEditing ? "true" : undefined} onClick={() => { beginEdit(product); setMenuOpen(false); setMenuPinned(false); }} type="button">Editar</button>
          <button className={styles.dangerMenuItem} disabled={pending} onClick={() => { setConfirmingArchive(true); setMenuOpen(false); setMenuPinned(false); }} type="button">Excluir</button>
        </div>
      </details>
      {state.status === "error" && !confirmingArchive ? <p className={styles.actionError} role="alert">{state.message}</p> : null}
      {confirmingArchive ? <div className={styles.confirmationOverlay} onKeyDown={(event) => { if (event.key === "Escape") setConfirmingArchive(false); }} role="presentation">
        <section aria-describedby={`archive-product-description-${product.id}`} aria-labelledby={`archive-product-title-${product.id}`} aria-modal="true" className={styles.confirmationDialog} role="alertdialog">
          <h3 id={`archive-product-title-${product.id}`}>Excluir produto?</h3>
          <p id={`archive-product-description-${product.id}`}>O produto <strong>{product.name}</strong> deixará de aparecer no catálogo.</p>
          {state.status === "error" ? <p className={styles.actionError} role="alert">{state.message}</p> : null}
          <div className={styles.confirmationDialogActions}>
            <button autoFocus className={`${styles.secondaryButton} ${styles.confirmationDialogButton}`} onClick={() => setConfirmingArchive(false)} type="button">Cancelar</button>
            <form action={archiveAction}>
              <input name="productId" type="hidden" value={product.id} />
              <input name="expectedVersion" type="hidden" value={product.version} />
              <input name="intent" type="hidden" value="archive" />
              <input name="confirmArchive" type="hidden" value="yes" />
              <button className={`${styles.dangerButton} ${styles.confirmationDialogButton}`} disabled={pending} type="submit">{pending ? "Excluindo…" : "Excluir produto"}</button>
            </form>
          </div>
        </section>
      </div> : null}
    </div>
  );
}
