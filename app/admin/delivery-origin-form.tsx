"use client";

import { useActionState } from "react";
import type { DeliveryOriginView } from "../../data/admin-delivery-governance.server";
import { saveDeliveryOrigin, validateDeliveryOrigin, type DeliveryGovernanceActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: DeliveryGovernanceActionState = { status: "idle", message: "" };

export function DeliveryOriginForm({ origin }: { origin: DeliveryOriginView | null }) {
  const [saveState, saveAction, savePending] = useActionState(saveDeliveryOrigin, initialState);
  const [validationState, validationAction, validationPending] = useActionState(validateDeliveryOrigin, initialState);
  return <div className={styles.deliveryOriginWorkspace}>
    <form action={saveAction} className={styles.governanceStandaloneForm}>
      <input name="expectedVersion" type="hidden" value={origin?.version ?? ""} />
      <div className={styles.originFields}>
        <label><span>Identificação</span><input defaultValue={origin?.label ?? "Loja principal"} maxLength={80} name="label" required /></label>
        <label><span>CEP</span><input defaultValue={origin?.postalCode} inputMode="numeric" maxLength={9} name="postalCode" placeholder="00000-000" required /></label>
        <label className={styles.originStreet}><span>Logradouro</span><input defaultValue={origin?.street} maxLength={120} name="street" required /></label>
        <label><span>Número</span><input defaultValue={origin?.number} maxLength={20} name="number" required /></label>
        <label><span>Complemento</span><input defaultValue={origin?.complement} maxLength={80} name="complement" /></label>
        <label><span>Bairro</span><input defaultValue={origin?.neighborhood} maxLength={80} name="neighborhood" required /></label>
        <label><span>Cidade</span><input defaultValue={origin?.city} maxLength={80} name="city" required /></label>
        <label><span>UF</span><input defaultValue={origin?.state} maxLength={2} name="state" placeholder="SP" required /></label>
      </div>
      <p className={styles.formContext}>O endereço é salvo primeiro. A validação geográfica só ocorre quando você solicitar abaixo.</p>
      {origin ? <p className={`${styles.originStatus} ${origin.geocodingStatus === "verified" ? styles.originStatusVerified : origin.geocodingStatus === "failed" ? styles.originStatusFailed : styles.originStatusPending}`} role="status">Validação geográfica: {origin.geocodingStatus === "verified" ? "validada" : origin.geocodingStatus === "failed" ? "não concluída" : "aguardando validação"}.</p> : null}
      <button className={styles.secondaryButton} disabled={savePending} type="submit">{savePending ? "Salvando…" : "Salvar origem"}</button>
      {saveState.message ? <p className={saveState.status === "error" ? styles.actionError : styles.actionSuccess} role={saveState.status === "error" ? "alert" : "status"}>{saveState.message}</p> : null}
    </form>
    {origin && origin.geocodingStatus !== "verified" ? <form action={validationAction} className={styles.originValidationForm}>
      <input name="expectedVersion" type="hidden" value={origin.version} />
      <div><h3>Validar origem</h3><p>Envia somente o endereço comercial cadastrado à Geoapify para obter as coordenadas da loja.</p></div>
      <button className={styles.secondaryButton} disabled={validationPending} type="submit">{validationPending ? "Validando…" : "Validar com Geoapify"}</button>
      {validationState.message ? <p className={validationState.status === "error" ? styles.actionError : styles.actionSuccess} role={validationState.status === "error" ? "alert" : "status"}>{validationState.message}</p> : null}
    </form> : null}
  </div>;
}
