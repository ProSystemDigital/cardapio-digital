"use client";

import { useEffect, useRef, useState } from "react";
import { FaCopy, FaTimes } from "react-icons/fa";
import type { OrderDraft } from "../../../domain/order-draft";
import { formatOrderMessage } from "../../../domain/order-draft";
import styles from "./OrderPreview.module.scss";

type OrderPreviewProps = {
  draft: OrderDraft;
  onClose: () => void;
};

export default function OrderPreview({ draft, onClose }: OrderPreviewProps) {
  const message = formatOrderMessage(draft);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="preview-title" aria-describedby="preview-warning">
        <header><div><p>Resumo local</p><h2 id="preview-title">Prévia do pedido</h2></div><button ref={closeButtonRef} onClick={onClose} aria-label="Fechar prévia"><FaTimes aria-hidden="true" /></button></header>
        <strong id="preview-warning" className={styles.warning}>Prévia — pedido não enviado</strong>
        <pre>{message}</pre>
        <footer>
          <span aria-live="polite">{copyStatus === "success" ? "Resumo copiado." : copyStatus === "error" ? "Não foi possível copiar. A prévia continua disponível." : ""}</span>
          <button onClick={copyMessage}><FaCopy aria-hidden="true" /> Copiar resumo</button>
        </footer>
      </section>
    </div>
  );
}
