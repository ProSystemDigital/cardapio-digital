"use client";

import { useActionState, useEffect, useState } from "react";
import { createCategoryManagement, type CategoryCreationActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: CategoryCreationActionState = { status: "idle", message: "" };

function CategoryCreationDraft({ onCancel, onCreated }: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [state, action, pending] = useActionState(createCategoryManagement, initialState);

  useEffect(() => {
    if (state.status === "success") onCreated();
  }, [onCreated, state.status]);

  return (
    <form action={action} className={styles.categoryCreationForm} id="new-category-card">
      <div className={styles.categoryCreationHeader}>
        <strong>Nova categoria</strong>
      </div>
      <label className={styles.contentField}>
        Nome da nova categoria
        <input autoFocus maxLength={80} name="name" required type="text" />
      </label>
      <label className={styles.contentField}>
        Ordem
        <input max={10000} min={0} name="sortOrder" required type="number" />
      </label>
      <label className={`${styles.confirmation} ${styles.categoryCreationConfirmation}`}>
        <input name="confirmed" required type="checkbox" value="yes" />
        Confirmo a criação desta categoria.
      </label>
      <div className={styles.categoryCreationActions}>
        <button className={styles.secondaryButton} disabled={pending} type="submit">
          {pending ? "Criando…" : "Criar categoria"}
        </button>
        <button className={styles.textButton} disabled={pending} onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
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

export function CategoryCreationForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [created, setCreated] = useState(false);

  if (isOpen) {
    return (
      <CategoryCreationDraft
        onCancel={() => setIsOpen(false)}
        onCreated={() => {
          setCreated(true);
          setIsOpen(false);
        }}
      />
    );
  }

  return (
    <div className={styles.categoryCreationControl}>
      <button
        aria-controls="new-category-card"
        aria-expanded="false"
        className={styles.categoryCreationTrigger}
        onClick={() => {
          setCreated(false);
          setIsOpen(true);
        }}
        type="button"
      >
        <span aria-hidden="true">+</span> Adicionar categoria
      </button>
      {created ? <p className={styles.actionSuccess} role="status">Categoria criada e auditada.</p> : null}
    </div>
  );
}
