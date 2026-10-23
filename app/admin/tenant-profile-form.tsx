"use client";

import { useActionState } from "react";
import {
  MAX_TENANT_SHORT_NAME_LENGTH,
  MAX_TENANT_TAGLINE_LENGTH,
} from "../../domain/tenant-profile-administration";
import { updateTenantProfile, type TenantProfileActionState } from "./actions";
import styles from "./admin.module.scss";

const initialState: TenantProfileActionState = { status: "idle", message: "" };

export function TenantProfileForm({
  version,
  shortName,
  tagline,
}: {
  version: number;
  shortName: string;
  tagline: string;
}) {
  const [state, action, pending] = useActionState(updateTenantProfile, initialState);

  return (
    <form action={action} className={styles.tenantProfileForm}>
      <input name="expectedVersion" type="hidden" value={version} />
      <label className={styles.contentField}>
        <span className={styles.fieldLabel}>
          Nome da Empresa
          <small>Até {MAX_TENANT_SHORT_NAME_LENGTH} caracteres</small>
        </span>
        <input
          defaultValue={shortName}
          maxLength={MAX_TENANT_SHORT_NAME_LENGTH}
          name="shortName"
          required
          type="text"
        />
      </label>
      <label className={styles.contentField}>
        <span className={styles.fieldLabel}>
          Slogan
          <small>Até {MAX_TENANT_TAGLINE_LENGTH} caracteres</small>
        </span>
        <input
          defaultValue={tagline}
          maxLength={MAX_TENANT_TAGLINE_LENGTH}
          name="tagline"
          required
          type="text"
        />
      </label>
      <button className={styles.secondaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Salvar perfil"}
      </button>
      {state.message ? (
        <p
          className={state.status === "error" ? styles.actionError : styles.actionSuccess}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
