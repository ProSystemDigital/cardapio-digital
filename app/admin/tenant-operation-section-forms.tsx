"use client";

import { useActionState } from "react";
import type { BusinessHours, PaymentMethod } from "../../domain/catalog";
import { BRAZILIAN_WHATSAPP_EXAMPLE, BRAZILIAN_WHATSAPP_INPUT_PATTERN, formatBrazilianWhatsapp } from "../../domain/brazilian-whatsapp";
import { updateTenantAttendance, updateTenantFinance, updateTenantLogistics, updateTenantTables, type TenantOperationsActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: TenantOperationsActionState = { status: "idle", message: "" };
const weekdays = [
  ["monday", "Segunda-feira"], ["tuesday", "Terça-feira"], ["wednesday", "Quarta-feira"],
  ["thursday", "Quinta-feira"], ["friday", "Sexta-feira"], ["saturday", "Sábado"], ["sunday", "Domingo"],
] as const;
const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix", cash: "Dinheiro", credit_card: "Cartão de crédito", debit_card: "Cartão de débito",
};
const reais = (cents: number) => (cents / 100).toFixed(2);

function ActionMessage({ state }: { state: TenantOperationsActionState }) {
  return state.message ? <p className={state.status === "error" ? styles.actionError : styles.actionSuccess} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null;
}

export function TenantAttendanceForm({ version, whatsappNumber, businessHours }: {
  version: number;
  whatsappNumber?: string;
  businessHours: readonly BusinessHours[];
}) {
  const [state, action, pending] = useActionState(updateTenantAttendance, initialState);
  const hoursByWeekday = new Map(businessHours.map((hours) => [hours.weekday, hours]));
  return <form action={action} className={styles.tenantOperationsForm}>
    <input name="expectedVersion" type="hidden" value={version} />
    <div className={styles.attendanceContactField}>
      <label><span>WhatsApp para pedidos</span><input defaultValue={formatBrazilianWhatsapp(whatsappNumber ?? "")} inputMode="tel" maxLength={19} name="whatsappNumber" onChange={(event) => { event.currentTarget.value = formatBrazilianWhatsapp(event.currentTarget.value); }} pattern={BRAZILIAN_WHATSAPP_INPUT_PATTERN} placeholder={BRAZILIAN_WHATSAPP_EXAMPLE} required type="tel" /></label>
    </div>
    <fieldset className={styles.weeklyHoursEditor}>
      <legend>Horários de atendimento</legend>
      {weekdays.map(([weekday, label]) => {
        const hours = hoursByWeekday.get(weekday);
        return <div className={styles.weekdayRow} key={weekday}>
          <strong>{label}</strong>
          <label><span>Abre</span><input defaultValue={hours?.opensAt ?? "09:00"} name={`opens-${weekday}`} type="time" /></label>
          <label><span>Fecha</span><input defaultValue={hours?.closesAt ?? "18:00"} name={`closes-${weekday}`} type="time" /></label>
          <label className={styles.closedDay}><input defaultChecked={!hours} name={`closed-${weekday}`} type="checkbox" value="yes" /> Fechado</label>
        </div>;
      })}
    </fieldset>
    <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar atendimento"}</button>
    <ActionMessage state={state} />
  </form>;
}

export function TenantTablesForm({ version, diningTables }: { version: number; diningTables: readonly string[] }) {
  const [state, action, pending] = useActionState(updateTenantTables, initialState);
  const editableTables = diningTables.map((table) => table.includes(" · ") ? table.replace(" · ", " | ") : `Ambiente principal | ${table}`);
  return <form action={action} className={styles.tenantOperationsForm}>
    <input name="expectedVersion" type="hidden" value={version} />
    <label className={styles.contentField}>
      <span>Mesas por ambiente</span>
      <small>Informe uma por linha no formato Ambiente | Mesa. Ex.: Salão principal | Mesa 01.</small>
      <textarea aria-describedby="dining-tables-help" defaultValue={editableTables.join("\n")} maxLength={7399} name="diningTables" rows={8} />
    </label>
    <p id="dining-tables-help">Até 100 mesas. Ambiente com até 40 caracteres e identificação com até 30.</p>
    <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar mesas"}</button>
    <ActionMessage state={state} />
  </form>;
}

export function TenantFinanceForm({ version, minimumOrderInCents, paymentMethods }: {
  version: number;
  minimumOrderInCents: number;
  paymentMethods: readonly PaymentMethod[];
}) {
  const [state, action, pending] = useActionState(updateTenantFinance, initialState);
  return <form action={action} className={styles.tenantOperationsForm}>
    <input name="expectedVersion" type="hidden" value={version} />
    <div className={styles.financeValueField}>
      <label><span>Pedido mínimo</span><span className={styles.moneyInput}><b>R$</b><input defaultValue={reais(minimumOrderInCents)} inputMode="decimal" name="minimumOrder" required /></span></label>
    </div>
    <fieldset className={styles.operationsPayments}>
      <legend>Formas de pagamento</legend>
      <div>{Object.entries(paymentLabels).map(([method, label]) => <label key={method}><input defaultChecked={paymentMethods.includes(method as PaymentMethod)} name="paymentMethods" type="checkbox" value={method} /> {label}</label>)}</div>
      <p>Pagamento online será tratado em uma fase futura.</p>
    </fieldset>
    <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar financeiro"}</button>
    <ActionMessage state={state} />
  </form>;
}

export function TenantLogisticsForm({ version, deliveryFeeInCents, maximumDeliveryDistanceInMeters }: {
  version: number;
  deliveryFeeInCents: number;
  maximumDeliveryDistanceInMeters: number;
}) {
  const [state, action, pending] = useActionState(updateTenantLogistics, initialState);
  return <form action={action} className={styles.tenantOperationsForm}>
    <input name="expectedVersion" type="hidden" value={version} />
    <div className={styles.logisticsValueFields}>
      <label><span>Taxa de entrega</span><span className={styles.moneyInput}><b>R$</b><input defaultValue={reais(deliveryFeeInCents)} inputMode="decimal" name="deliveryFee" required /></span></label>
      <label><span>Distância para entrega</span><span className={styles.distanceInput}><input defaultValue={(maximumDeliveryDistanceInMeters / 1000).toFixed(1).replace(/\.0$/, "")} inputMode="decimal" max="200" min="0.5" name="maximumDeliveryDistance" required step="0.5" type="number" /><b>km</b></span></label>
    </div>
    <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar logística"}</button>
    <ActionMessage state={state} />
  </form>;
}
