import "server-only";
import type { TenantProfile } from "../domain/catalog";
import type { BrazilianDeliveryAddress, DeliveryCoverageResult } from "../domain/delivery-coverage";
import {
  evaluateConfiguredDeliveryCoverage,
  type DeliveryCoverageProviderMode,
  type DeliveryCoverageRuntime,
} from "../application/configured-delivery-coverage";

function providerMode(): DeliveryCoverageProviderMode {
  if (process.env.NODE_ENV === "production" || process.env.DELIVERY_COVERAGE_PROVIDER === "disabled") return "disabled";
  return "local_fixtures";
}

function runtime(): DeliveryCoverageRuntime {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

export async function evaluateTrustedTenantDeliveryCoverage(input: Readonly<{
  tenant: Pick<TenantProfile, "id" | "operations">;
  destination: BrazilianDeliveryAddress;
}>): Promise<DeliveryCoverageResult> {
  return evaluateConfiguredDeliveryCoverage({
    tenantId: input.tenant.id,
    maximumDistanceInMeters: input.tenant.operations.maximumDeliveryDistanceInMeters,
    destination: input.destination,
    providerMode: providerMode(),
    runtime: runtime(),
  });
}
