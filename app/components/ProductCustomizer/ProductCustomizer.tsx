"use client";

import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import type { AddonId, Product, VariationId } from "../../../domain/catalog";
import type { ProductSelection } from "../../../domain/order-cart";
import styles from "./ProductCustomizer.module.scss";

type ProductCustomizerProps = {
  product: Product;
  initialSelection?: ProductSelection;
  formatPrice: (priceInCents: number) => string;
  onCancel: () => void;
  onConfirm: (selection: ProductSelection) => readonly string[];
};

export default function ProductCustomizer({
  product,
  initialSelection,
  formatPrice,
  onCancel,
  onConfirm,
}: ProductCustomizerProps) {
  const [variationId, setVariationId] = useState<VariationId | undefined>(
    initialSelection?.variationId,
  );
  const [addonIds, setAddonIds] = useState<Set<AddonId>>(
    () => new Set(initialSelection?.addonIds ?? []),
  );
  const [errors, setErrors] = useState<readonly string[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled])",
        )];
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
  }, [onCancel]);

  const toggleAddon = (addonId: AddonId) => {
    setAddonIds((current) => {
      const next = new Set(current);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const submit = () => {
    const nextErrors = onConfirm({
      tenantId: product.tenantId,
      productId: product.id,
      variationId,
      addonIds: [...addonIds],
    });
    if (nextErrors.length > 0) setErrors(nextErrors);
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="customizer-title" aria-describedby="customizer-description">
        <header>
          <div><p>Personalize seu item</p><h2 id="customizer-title">{product.name}</h2></div>
          <button ref={closeButtonRef} onClick={onCancel} aria-label="Fechar personalização"><FaTimes aria-hidden="true" /></button>
        </header>
        <p id="customizer-description" className={styles.description}>{product.description}</p>

        {product.variations?.length ? (
          <fieldset>
            <legend>Escolha uma variação <small>Obrigatório</small></legend>
            {product.variations.map((variation) => (
              <label key={variation.id} className={!variation.isAvailable ? styles.disabled : ""}>
                <input type="radio" name="variation" value={variation.id} checked={variationId === variation.id} disabled={!variation.isAvailable} onChange={() => setVariationId(variation.id)} />
                <span>{variation.name}</span>
                <strong>{variation.priceDeltaInCents === 0 ? "Incluso" : `+ ${formatPrice(variation.priceDeltaInCents)}`}</strong>
              </label>
            ))}
          </fieldset>
        ) : null}

        {product.addonGroups?.map((group) => (
          <fieldset key={group.id}>
            <legend>{group.name} <small>Escolha de {group.minimumSelections} a {group.maximumSelections}</small></legend>
            {group.addons.map((addon) => (
              <label key={addon.id} className={!addon.isAvailable ? styles.disabled : ""}>
                <input type="checkbox" checked={addonIds.has(addon.id)} disabled={!addon.isAvailable} onChange={() => toggleAddon(addon.id)} />
                <span>{addon.name}</span>
                <strong>+ {formatPrice(addon.priceInCents)}</strong>
              </label>
            ))}
          </fieldset>
        ))}

        {errors.length ? <div className={styles.errors} role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
        <footer><button className={styles.cancel} onClick={onCancel}>Cancelar</button><button className={styles.confirm} onClick={submit}>{initialSelection ? "Salvar alterações" : "Adicionar ao carrinho"}</button></footer>
      </section>
    </div>
  );
}
