import { AdminConfigurationsPage } from "../admin-surfaces";
import type { AdminConfigurationStepId } from "../admin-configuration-steps";

const validSections = new Set<AdminConfigurationStepId>([
  "profile",
  "attendance",
  "finance",
  "logistics",
  "privacy",
  "categories",
  "products",
  "tables",
]);

export default async function ConfigurationsRoute({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string | string[] }>;
}) {
  const section = (await searchParams).secao;
  const activeStep = typeof section === "string" && validSections.has(section as AdminConfigurationStepId)
    ? section as AdminConfigurationStepId
    : "profile";

  return <AdminConfigurationsPage activeStep={activeStep} />;
}
