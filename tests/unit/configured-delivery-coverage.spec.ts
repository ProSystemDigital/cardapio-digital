import { expect, test } from "@playwright/test";
import { evaluateConfiguredDeliveryCoverage } from "../../application/configured-delivery-coverage";
import { LOCAL_COVERAGE_FAR_ADDRESS, LOCAL_COVERAGE_NEAR_ADDRESS } from "../../data/local-delivery-coverage-fixtures";

test("executa cobertura local ponta a ponta com origem confiavel do tenant", async () => {
  await expect(evaluateConfiguredDeliveryCoverage({
    tenantId: "tenant-mesa-viva",
    maximumDistanceInMeters: 5_000,
    destination: LOCAL_COVERAGE_NEAR_ADDRESS,
    providerMode: "local_fixtures",
    runtime: "development",
  })).resolves.toEqual({ kind: "covered", distanceInMeters: 4_800, durationInSeconds: 780 });

  await expect(evaluateConfiguredDeliveryCoverage({
    tenantId: "tenant-mesa-viva",
    maximumDistanceInMeters: 20_000,
    destination: LOCAL_COVERAGE_FAR_ADDRESS,
    providerMode: "local_fixtures",
    runtime: "test",
  })).resolves.toEqual({ kind: "outside_coverage", distanceInMeters: 24_000, durationInSeconds: 2_700 });
});

test("falha fechada em producao, tenant desconhecido, provider desligado ou limite ausente", async () => {
  const base = {
    tenantId: "tenant-mesa-viva",
    maximumDistanceInMeters: 5_000,
    destination: LOCAL_COVERAGE_NEAR_ADDRESS,
    providerMode: "local_fixtures" as const,
    runtime: "development" as const,
  };
  await expect(evaluateConfiguredDeliveryCoverage({ ...base, runtime: "production" })).resolves.toEqual({ kind: "temporarily_unavailable" });
  await expect(evaluateConfiguredDeliveryCoverage({ ...base, tenantId: "tenant-inexistente" })).resolves.toEqual({ kind: "temporarily_unavailable" });
  await expect(evaluateConfiguredDeliveryCoverage({ ...base, providerMode: "disabled" })).resolves.toEqual({ kind: "temporarily_unavailable" });
  await expect(evaluateConfiguredDeliveryCoverage({ ...base, maximumDistanceInMeters: undefined })).resolves.toEqual({ kind: "temporarily_unavailable" });
  await expect(evaluateConfiguredDeliveryCoverage({ ...base, maximumDistanceInMeters: 1 })).resolves.toEqual({ kind: "temporarily_unavailable" });
});
