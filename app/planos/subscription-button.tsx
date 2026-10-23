"use client";

import { useFormStatus } from "react-dom";

export function SubscriptionButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} type="submit">{pending ? "Abrindo checkout…" : children}</button>;
}
