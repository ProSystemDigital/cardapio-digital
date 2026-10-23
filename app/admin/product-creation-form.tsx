"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { FulfillmentMode } from "../../domain/catalog";
import { createProductManagement, updateProductManagement, type ProductManagementActionState } from "./actions";
import { useProductManagementWorkspace } from "./product-management-workspace";
import styles from "./admin.module.scss";

const initialState: ProductManagementActionState = { status: "idle", message: "" };
const modeLabels: Record<FulfillmentMode, string> = { delivery: "Entrega", dine_in: "Na mesa", pickup: "Retirada" };
const modeOrder: readonly FulfillmentMode[] = ["pickup", "delivery", "dine_in"];
type CommonProps = { categories: readonly { id: string; name: string }[]; tenantModes: readonly FulfillmentMode[] };
export type EditableProduct = { id: string; version: number; name: string; description: string; priceInCents: number; categoryId: string; isAvailable: boolean; fulfillmentModes: readonly FulfillmentMode[]; imageVersion: number | null };

function CategorySelect({ categories, initialValue }: { categories: CommonProps["categories"]; initialValue: string }) {
  const labelId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const selectedLabel = categories.find((category) => category.id === value)?.name ?? "Selecione";

  return (
    <div className={styles.customSelectField} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <span id={labelId}>Categoria</span>
      <input name="categoryId" type="hidden" value={value} />
      <button aria-controls={listId} aria-expanded={open} aria-haspopup="listbox" aria-labelledby={`${labelId} ${listId}-value`} className={styles.customSelectButton} id={`${listId}-value`} onClick={() => setOpen((current) => !current)} type="button">
        <span>{selectedLabel}</span><span aria-hidden="true" className={styles.customSelectChevron} />
      </button>
      {open ? <div aria-labelledby={labelId} className={styles.customSelectOptions} id={listId} role="listbox">
        {categories.map((category) => <button aria-selected={category.id === value} className={category.id === value ? styles.customSelectOptionSelected : undefined} key={category.id} onClick={() => { setValue(category.id); setOpen(false); }} role="option" type="button">{category.name}</button>)}
      </div> : null}
    </div>
  );
}

function ProductForm({ categories, product, onCancel, onSaved }: CommonProps & { product?: EditableProduct; onCancel: () => void; onSaved: (message: string) => void }) {
  const editing = Boolean(product);
  const [state, action, pending] = useActionState(editing ? updateProductManagement : createProductManagement, initialState);
  const [unavailable, setUnavailable] = useState(product ? !product.isAvailable : true);
  const [selectedModes, setSelectedModes] = useState<readonly FulfillmentMode[]>(
    product?.isAvailable ? product.fulfillmentModes : [],
  );
  useEffect(() => { if (state.status === "success") onSaved(state.message); }, [onSaved, state.message, state.status]);
  return <form action={action} className={styles.productCreationForm} id={editing ? `edit-product-${product?.id}` : "new-product-card"}>
    {product ? <><input name="productId" type="hidden" value={product.id} /><input name="expectedVersion" type="hidden" value={product.version} /><input name="imageVersion" type="hidden" value={product.imageVersion ?? ""} /></> : null}
    <div className={styles.productCreationHeader}><strong>{editing ? "Editar produto" : "Novo produto"}</strong></div>
    <div className={styles.productCreationFields}>
      <label className={styles.contentField}>Nome do produto<input autoFocus defaultValue={product?.name} maxLength={120} name="name" required type="text" /></label>
      <label className={styles.contentField}>Preço em reais<input defaultValue={product ? (product.priceInCents / 100).toFixed(2) : ""} inputMode="decimal" name="price" placeholder="0,00" required type="text" /></label>
      <CategorySelect categories={categories} initialValue={product?.categoryId ?? ""} key={product?.id ?? "new-product"} />
      <label className={`${styles.contentField} ${styles.productCreationDescription}`}>Descrição pública<textarea defaultValue={product?.description} maxLength={500} name="description" rows={3} /></label>
      <label className={`${styles.contentField} ${styles.productCreationImage}`}>{product?.imageVersion ? "Substituir imagem" : "Imagem do produto"}<input accept="image/jpeg,image/png,image/webp" name="image" type="file" /><small>JPEG, PNG ou WebP, até 5 MB.</small></label>
    </div>
    <fieldset><legend>Disponibilidade do Produto</legend><div className={styles.modeOptions}>
      <label><input checked={unavailable} name="unavailable" onChange={(event) => { setUnavailable(event.currentTarget.checked); if (event.currentTarget.checked) setSelectedModes([]); }} type="checkbox" value="yes" />Não disponível</label>
      {modeOrder.map((mode) => <label key={mode}><input checked={selectedModes.includes(mode)} name="fulfillmentModes" onChange={(event) => { const checked = event.currentTarget.checked; const nextModes = checked ? [...new Set([...selectedModes, mode])] : selectedModes.filter((item) => item !== mode); setSelectedModes(nextModes); setUnavailable(nextModes.length === 0); }} type="checkbox" value={mode} />{modeLabels[mode]}</label>)}
    </div></fieldset>
    <div className={styles.productFormActions}><button className={styles.secondaryButton} disabled={pending} name="intent" type="submit" value={editing ? "update" : "create"}>{pending ? "Salvando…" : editing ? "Salvar alterações" : "Salvar Produto"}</button>
      <button className={styles.textButton} disabled={pending} onClick={onCancel} type="button">Cancelar</button>
    </div>
    {state.message ? <p className={state.status === "error" ? styles.actionError : styles.actionSuccess} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}

export function ProductCreationForm(props: CommonProps) {
  const workspace = useProductManagementWorkspace();
  if (workspace.creating || workspace.selectedProduct) {
    return <ProductForm {...props} product={workspace.selectedProduct ?? undefined} onCancel={workspace.closeForm} onSaved={workspace.complete} />;
  }
  return <div className={styles.productCreationControl}><button aria-controls="new-product-card" aria-expanded="false" className={styles.productCreationTrigger} onClick={workspace.beginCreate} type="button"><span aria-hidden="true">+</span> Adicionar produto</button></div>;
}
