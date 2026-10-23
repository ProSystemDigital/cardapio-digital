"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EditableProduct } from "./product-creation-form";
import styles from "./admin.module.scss";

type ProductWorkspaceState = {
  selectedProduct: EditableProduct | null;
  creating: boolean;
  message: string;
  beginCreate: () => void;
  beginEdit: (product: EditableProduct) => void;
  closeForm: () => void;
  complete: (message: string) => void;
};

const ProductWorkspaceContext = createContext<ProductWorkspaceState | null>(null);

export function ProductManagementWorkspace({ children }: { children: ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<EditableProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5_000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const value = useMemo<ProductWorkspaceState>(() => ({
    selectedProduct,
    creating,
    message,
    beginCreate: () => { setMessage(""); setSelectedProduct(null); setCreating(true); },
    beginEdit: (product) => { setMessage(""); setCreating(false); setSelectedProduct(product); },
    closeForm: () => { setCreating(false); setSelectedProduct(null); },
    complete: (nextMessage) => {
      setMessage(nextMessage.includes("não foi salva") ? nextMessage : "Produto salvo com sucesso!");
      setCreating(false);
      setSelectedProduct(null);
    },
  }), [creating, message, selectedProduct]);
  return (
    <ProductWorkspaceContext.Provider value={value}>
      {children}
      {message ? <div aria-live="polite" className={styles.productSuccessToast} role="status">{message}</div> : null}
    </ProductWorkspaceContext.Provider>
  );
}

export function useProductManagementWorkspace(): ProductWorkspaceState {
  const context = useContext(ProductWorkspaceContext);
  if (!context) throw new Error("ProductManagementWorkspace ausente.");
  return context;
}
