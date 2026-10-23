"use client";

import { useActionState } from "react";
import type { TenantPrivacyView } from "../../data/admin-delivery-governance.server";
import { saveTenantPrivacy, type DeliveryGovernanceActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: DeliveryGovernanceActionState = { status: "idle", message: "" };

export function TenantPrivacyForm({ privacy }: { privacy: TenantPrivacyView | null }) {
  const [state, action, pending] = useActionState(saveTenantPrivacy, initialState);
  return <form action={action} className={styles.governanceStandaloneForm}>
    <input name="expectedVersion" type="hidden" value={privacy?.version ?? ""} />
    <div className={styles.governanceFields}>
      <label><span>Nome empresarial do controlador</span><input defaultValue={privacy?.controllerLegalName} maxLength={160} name="controllerLegalName" required /></label>
      <label><span>E-mail de privacidade</span><input defaultValue={privacy?.privacyEmail} maxLength={254} name="privacyEmail" required type="email" /></label>
      <label><span>Retenção do endereço</span><span className={styles.daysInput}><input defaultValue={privacy?.orderAddressRetentionDays ?? 90} max={3650} min={1} name="retentionDays" required type="number" /><b>dias</b></span></label>
    </div>
    <p className={styles.formContext}>Define o responsável pelos dados e por quanto tempo o endereço de pedidos confirmados será mantido.</p>
    <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar privacidade"}</button>
    {state.message ? <p className={state.status === "error" ? styles.actionError : styles.actionSuccess} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}
