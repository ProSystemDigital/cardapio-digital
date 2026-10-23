"use client";

import { useActionState } from "react";
import { testLocalDeliveryCoverage, type DeliveryCoveragePreviewActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: DeliveryCoveragePreviewActionState = { status: "idle", message: "" };

export function DeliveryCoveragePreview({ maximumDistanceInMeters }: { maximumDistanceInMeters: number }) {
  const [state, action, pending] = useActionState(testLocalDeliveryCoverage, initialState);
  const maximumDistanceInKilometers = (maximumDistanceInMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return (
    <section aria-labelledby="coverage-preview-title" className={styles.coveragePreview}>
      <div className={styles.coveragePreviewHeader}>
        <div>
          <span>Ambiente local</span>
          <h3 id="coverage-preview-title">Teste de área de entrega</h3>
          <p>Simule a distância configurada usando rotas fictícias. Nenhum endereço real é coletado.</p>
          <p className={styles.coverageCurrentLimit}>Limite atual: <strong>{maximumDistanceInKilometers} km</strong></p>
        </div>
        <strong>Dados fictícios</strong>
      </div>
      <form action={action}>
        <fieldset>
          <legend>Escolha um cenário</legend>
          <div className={styles.coverageScenarios}>
            <label>
              <input defaultChecked name="scenario" type="radio" value="near" />
              <span><b>Destino próximo</b><small>Rota simulada de 4,8 km</small></span>
            </label>
            <label>
              <input name="scenario" type="radio" value="far" />
              <span><b>Destino distante</b><small>Rota simulada de 24 km</small></span>
            </label>
          </div>
        </fieldset>
        <button className={styles.secondaryButton} disabled={pending} type="submit">
          {pending ? "Calculando…" : "Testar cobertura"}
        </button>
      </form>
      {state.message ? (
        <div className={state.status === "error" ? styles.coverageResultError : state.result?.covered ? styles.coverageResultCovered : styles.coverageResultOutside} role={state.status === "error" ? "alert" : "status"}>
          <strong>{state.message}</strong>
          {state.result ? <p>Distância da rota: {state.result.distanceInKilometers} km · Tempo estimado da rota: {state.result.durationInMinutes} min</p> : null}
        </div>
      ) : null}
      <p className={styles.coverageDisclaimer}>O tempo exibido representa apenas a rota simulada, não o prazo total do pedido.</p>
    </section>
  );
}
