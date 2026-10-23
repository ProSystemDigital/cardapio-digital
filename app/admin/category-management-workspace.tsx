"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./admin.module.scss";

const CategoryNotificationContext = createContext<((message: string) => void) | null>(null);

export function CategoryManagementWorkspace({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5_000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const notify = useMemo(() => (nextMessage: string) => setMessage(nextMessage), []);
  return <CategoryNotificationContext.Provider value={notify}>
    {children}
    {message ? <div aria-live="polite" className={styles.productSuccessToast} role="status">{message}</div> : null}
  </CategoryNotificationContext.Provider>;
}

export function useCategoryNotification(): (message: string) => void {
  const notify = useContext(CategoryNotificationContext);
  if (!notify) throw new Error("CategoryManagementWorkspace ausente.");
  return notify;
}
