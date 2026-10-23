"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCategoryManagement, type CategoryManagementActionState } from "./actions";
import { useCategoryNotification } from "./category-management-workspace";
import styles from "./admin.module.scss";

const initialState: CategoryManagementActionState = { status: "idle", message: "" };

export function CategoryManagementForm({ categoryId, version, name, sortOrder, productCount, index }: {
  categoryId: string; version: number; name: string; sortOrder: number; productCount: number; index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPinned, setMenuPinned] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archived, setArchived] = useState(false);
  const router = useRouter();
  const notify = useCategoryNotification();
  const [state, action, pending] = useActionState(async (previousState: CategoryManagementActionState, formData: FormData) => {
    const nextState = await updateCategoryManagement(previousState, formData);
    if (nextState.status === "success") {
      const categoryWasArchived = nextState.message.startsWith("Categoria excluída");
      setEditing(false);
      setConfirmingArchive(false);
      notify(categoryWasArchived ? "Categoria excluída" : "Categoria atualizada");
      if (categoryWasArchived) {
        setArchived(true);
        router.refresh();
      }
    }
    return nextState;
  }, initialState);
  const closeMenu = () => { setMenuOpen(false); setMenuPinned(false); };

  if (archived) return null;

  return <li>
    <div className={styles.categoryIdentity}>
      <span>{index + 1}. {name}</span>
      <small>{productCount} {productCount === 1 ? "produto" : "produtos"}</small>
    </div>
    <div className={styles.categoryCardEditor}>
    <details className={styles.productActionsMenu} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }} onFocus={() => setMenuOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") closeMenu(); }} onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => { if (!menuPinned) setMenuOpen(false); }} open={menuOpen}>
      <summary aria-expanded={menuOpen} aria-label={`Abrir ações de ${name}`} onClick={(event) => { event.preventDefault(); setMenuPinned((pinned) => { const next = !pinned; setMenuOpen(next); return next; }); }}>⋮</summary>
      <div aria-label={`Ações de ${name}`} className={styles.productActionsMenuItems}>
        <button onClick={() => { setEditing(true); closeMenu(); }} type="button">Editar</button>
        <button className={styles.dangerMenuItem} disabled={pending} onClick={() => { setConfirmingArchive(true); closeMenu(); }} type="button">Excluir</button>
      </div>
    </details>
    {editing ? <form action={action} className={styles.categoryManagementForm}>
      <input name="categoryId" type="hidden" value={categoryId} /><input name="expectedVersion" type="hidden" value={version} />
      <div className={styles.categoryCreationHeader}><strong>Editar categoria</strong></div>
      <label className={styles.contentField}>Nome da categoria<input defaultValue={name} maxLength={80} name="name" required type="text" /></label>
      <label className={styles.contentField}>Ordem<input defaultValue={sortOrder} max={10000} min={0} name="sortOrder" required type="number" /></label>
      <label className={`${styles.confirmation} ${styles.categoryCreationConfirmation}`}><input name="confirmed" required type="checkbox" value="yes" />Confirmo a atualização desta categoria.</label>
      <div className={styles.categoryCreationActions}>
        <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar categoria"}</button>
        <button className={styles.textButton} disabled={pending} onClick={() => setEditing(false)} type="button">Cancelar</button>
      </div>
    </form> : null}
    {state.status === "error" && !confirmingArchive ? <p className={styles.actionError} role="alert">{state.message}</p> : null}
    {confirmingArchive ? <div className={styles.confirmationOverlay} onKeyDown={(event) => { if (event.key === "Escape") setConfirmingArchive(false); }} role="presentation">
      <section aria-describedby={`archive-category-description-${categoryId}`} aria-labelledby={`archive-category-title-${categoryId}`} aria-modal="true" className={styles.confirmationDialog} role="alertdialog">
        <h3 id={`archive-category-title-${categoryId}`}>{productCount > 0 ? "Categoria vinculada a produtos" : "Excluir categoria?"}</h3>
        <p id={`archive-category-description-${categoryId}`}>
          {productCount > 0
            ? <>A categoria <strong>{name}</strong> possui {productCount} {productCount === 1 ? "produto" : "produtos"}. Transfira ou exclua {productCount === 1 ? "esse produto" : "esses produtos"} primeiro.</>
            : <>A categoria <strong>{name}</strong> deixará de aparecer no catálogo.</>}
        </p>
        {state.status === "error" ? <p className={styles.actionError} role="alert">{state.message}</p> : null}
        <div className={`${styles.confirmationDialogActions} ${productCount > 0 ? styles.confirmationDialogActionsSingle : ""}`}>
          <button autoFocus className={`${styles.secondaryButton} ${styles.confirmationDialogButton}`} onClick={() => setConfirmingArchive(false)} type="button">{productCount > 0 ? "Entendi" : "Cancelar"}</button>
          {productCount === 0 ? <form action={action}>
            <input name="categoryId" type="hidden" value={categoryId} /><input name="expectedVersion" type="hidden" value={version} /><input name="intent" type="hidden" value="archive" /><input name="confirmArchive" type="hidden" value="yes" />
            <button className={`${styles.dangerButton} ${styles.confirmationDialogButton}`} disabled={pending} type="submit">{pending ? "Excluindo…" : "Excluir categoria"}</button>
          </form> : null}
        </div>
      </section>
    </div> : null}
    </div>
  </li>;
}
