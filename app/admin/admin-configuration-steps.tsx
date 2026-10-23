import Link from "next/link";
import { Children, type ReactNode } from "react";
import styles from "./admin.module.scss";

const steps = [
  { id: "profile", label: "Perfil" },
  { id: "attendance", label: "Atendimento" },
  { id: "finance", label: "Financeiro" },
  { id: "logistics", label: "Logística" },
  { id: "privacy", label: "Privacidade" },
  { id: "categories", label: "Categorias" },
  { id: "products", label: "Produtos" },
  { id: "tables", label: "Mesas" },
] as const;

export type AdminConfigurationStepId = (typeof steps)[number]["id"];

export function AdminConfigurationSteps({
  children,
  activeStep,
}: {
  children: ReactNode;
  activeStep: AdminConfigurationStepId;
}) {
  const panels = Children.toArray(children);

  return (
    <div className={styles.configurationWorkspace}>
      <nav aria-label="Etapas de configuração" className={styles.configurationNavigation}>
        <ol>
          {steps.map((step, index) => {
            const active = activeStep === step.id;
            return (
              <li key={step.id}>
                <Link
                  aria-current={active ? "step" : undefined}
                  className={active ? styles.configurationStepActive : styles.configurationStep}
                  href={`/admin/configuracoes?secao=${step.id}`}
                >
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      {steps.map((step, index) => (
        <div
          aria-label={`Configurações de ${step.label.toLocaleLowerCase("pt-BR")}`}
          className={styles.configurationPanel}
          hidden={activeStep !== step.id}
          id={`configuration-panel-${step.id}`}
          key={step.id}
        >
          {panels[index]}
        </div>
      ))}
    </div>
  );
}
