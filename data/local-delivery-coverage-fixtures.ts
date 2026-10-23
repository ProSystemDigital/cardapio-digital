import type { BrazilianDeliveryAddress, GeographicPoint } from "../domain/delivery-coverage";
import type { GeocodingResult, RouteCalculationResult } from "./delivery-location-ports";

export const LOCAL_COVERAGE_NEAR_ADDRESS: BrazilianDeliveryAddress = {
  postalCode: "01001000",
  street: "Rua Ficticia HKA",
  number: "100",
  city: "Sao Paulo",
  state: "SP",
  country: "BR",
};

export const LOCAL_COVERAGE_FAR_ADDRESS: BrazilianDeliveryAddress = {
  postalCode: "01002000",
  street: "Avenida Ficticia HKA",
  number: "900",
  city: "Sao Paulo",
  state: "SP",
  country: "BR",
};

const origin: GeographicPoint = { latitude: -23.55052, longitude: -46.633308 };
const nearPoint: GeographicPoint = { latitude: -23.556, longitude: -46.64 };
const farPoint: GeographicPoint = { latitude: -23.68, longitude: -46.76 };

export type LocalDeliveryCoverageFixture = Readonly<{
  origin: GeographicPoint;
  geocoding: readonly Readonly<{ address: BrazilianDeliveryAddress; result: GeocodingResult }>[];
  routing: readonly Readonly<{ origin: GeographicPoint; destination: GeographicPoint; result: RouteCalculationResult }>[];
}>;

const fixture: LocalDeliveryCoverageFixture = {
  origin,
  geocoding: [
    { address: LOCAL_COVERAGE_NEAR_ADDRESS, result: { kind: "found", point: nearPoint } },
    { address: LOCAL_COVERAGE_FAR_ADDRESS, result: { kind: "found", point: farPoint } },
  ],
  routing: [
    { origin, destination: nearPoint, result: { kind: "found", distanceInMeters: 4_800, durationInSeconds: 780 } },
    { origin, destination: farPoint, result: { kind: "found", distanceInMeters: 24_000, durationInSeconds: 2_700 } },
  ],
};

const fixturesByTenant = new Map<string, LocalDeliveryCoverageFixture>([
  ["tenant-mesa-viva", fixture],
  ["30000000-0000-0000-0000-000000000003", fixture],
]);

export function findLocalDeliveryCoverageFixture(tenantId: string): LocalDeliveryCoverageFixture | null {
  return fixturesByTenant.get(tenantId) ?? null;
}
