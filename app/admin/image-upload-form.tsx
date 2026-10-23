"use client";

import Image from "next/image";
import { type ChangeEvent, useActionState, useEffect, useId, useRef, useState } from "react";
import { uploadCatalogImage, type CatalogImageActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: CatalogImageActionState = { status: "idle", message: "" };
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumBytes = 5 * 1024 * 1024;

type ImageUploadFormProps = Readonly<{
  target: "tenant_logo" | "product";
  expectedVersion: number | null;
  currentUrl?: string;
  productId?: string;
  productName?: string;
  initialAltText?: string;
}>;

export function ImageUploadForm({
  target,
  expectedVersion,
  currentUrl,
  productId,
  productName,
  initialAltText,
}: ImageUploadFormProps) {
  const [state, action, pending] = useActionState(uploadCatalogImage, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [selectionError, setSelectionError] = useState("");
  const previewRef = useRef<string | undefined>(undefined);
  const inputId = useId();
  const helpId = useId();
  const isLogo = target === "tenant_logo";

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = undefined;
    setPreviewUrl(undefined);
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setSelectionError("");
      return;
    }
    if (!acceptedTypes.has(file.type) || file.size < 1 || file.size > maximumBytes) {
      event.currentTarget.value = "";
      setSelectionError("Selecione JPEG, PNG ou WebP com até 5 MB.");
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    previewRef.current = nextPreview;
    setPreviewUrl(nextPreview);
    setSelectionError("");
  }

  const visibleUrl = previewUrl ?? currentUrl;
  const previewAlt = isLogo
    ? "Prévia da logo selecionada"
    : `Prévia da imagem de ${productName ?? "produto"}`;

  return (
    <form action={action} className={styles.imageUploadForm}>
      <input name="targetKind" type="hidden" value={target} />
      <input name="expectedVersion" type="hidden" value={expectedVersion ?? ""} />
      {productId ? <input name="productId" type="hidden" value={productId} /> : null}
      <div className={isLogo ? styles.logoUploadPreview : styles.productUploadPreview}>
        {visibleUrl ? (
          <Image
            alt={previewAlt}
            fill
            sizes={isLogo ? "128px" : "(max-width: 544px) 100vw, 320px"}
            src={visibleUrl}
            unoptimized={Boolean(previewUrl)}
          />
        ) : (
          <span aria-hidden="true">Sem imagem</span>
        )}
      </div>
      <div className={styles.imageUploadFields}>
        <label className={styles.contentField} htmlFor={inputId}>
          {currentUrl ? "Adicionar imagem" : "Selecionar imagem"}
          <input
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={helpId}
            id={inputId}
            name="image"
            onChange={handleSelection}
            required
            type="file"
          />
        </label>
        <p className={styles.imageUploadHelp} id={helpId}>
          JPEG, PNG ou WebP, até 5 MB.
        </p>
        {!isLogo ? (
          <label className={styles.contentField}>
            Texto alternativo
            <input
              defaultValue={initialAltText ?? productName ?? ""}
              maxLength={160}
              name="altText"
              required
              type="text"
            />
          </label>
        ) : null}
        <button className={styles.secondaryButton} disabled={pending || Boolean(selectionError)} type="submit">
          {pending ? "Processando…" : "Salvar imagem"}
        </button>
        {selectionError ? <p className={styles.actionError} role="alert">{selectionError}</p> : null}
        {state.message ? (
          <p
            className={state.status === "error" ? styles.actionError : styles.actionSuccess}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
