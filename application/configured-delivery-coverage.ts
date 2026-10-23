import { DeliveryCoverageService } from "./delivery-coverage-service";
import { LocalDeliveryGeocoder, LocalDeliveryRouter } from "../data/local-delivery-location-adapters";
import { findLocalDeliveryCoverageFixture } from "../data/local-delivery-coverage-fixtures";
import type { BrazilianDeliveryAddress, DeliveryCoverageResult } from "../domain/delivery-coverage";

export type DeliveryCoverageProviderMode = "disabled" | "local_fixtures";
export type DeliveryCoverageRuntime = "development" | "test" | "production";

export async function evaluateConfiguredDeliveryCoverage(input: Readonly<{
  tenantId: string;
  maximumDistanceInMeters: number | undefined;
  destination: BrazilianDeliveryAddress;
  providerMode: DeliveryCoverageProviderMode;
  runtime: DeliveryCoverageRuntime;
}>): Promise<DeliveryCoverageResult> {
  if (input.runtime === "production" || input.providerMode !== "local_fixtures" ||
      input.maximumDistanceInMeters === undefined) {
    return { kind: "temporarily_unavailable" };
  }
  const fixture = findLocalDeliveryCoverageFixture(input.tenantId);
  if (!fixture) return { kind: "temporarily_unavailable" };
  try {
    return await new DeliveryCoverageService(
      new LocalDeliveryGeocoder(fixture.geocoding),
      new LocalDeliveryRouter(fixture.routing),
    ).evaluate({
      origin: fixture.origin,
      destination: input.destination,
      maximumDistanceInMeters: input.maximumDistanceInMeters,
    });
  } catch {
    return { kind: "temporarily_unavailable" };
  }
}
