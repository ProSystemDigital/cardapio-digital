import type { DeliveryGeocodingPort, DeliveryRoutingPort, GeocodingResult, RouteCalculationResult } from "./delivery-location-ports";
import type { BrazilianDeliveryAddress, GeographicPoint } from "../domain/delivery-coverage";

function addressKey(address: BrazilianDeliveryAddress): string {
  return [address.postalCode, address.street, address.number, address.city, address.state].join("|").toLocaleLowerCase("pt-BR");
}

function pointKey(point: GeographicPoint): string {
  return `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
}

export class LocalDeliveryGeocoder implements DeliveryGeocodingPort {
  private readonly fixtures: ReadonlyMap<string, GeocodingResult>;

  constructor(fixtures: readonly Readonly<{ address: BrazilianDeliveryAddress; result: GeocodingResult }>[]) {
    this.fixtures = new Map(fixtures.map(({ address, result }) => [addressKey(address), result]));
  }

  async geocode(address: BrazilianDeliveryAddress, signal: AbortSignal): Promise<GeocodingResult> {
    if (signal.aborted) return { kind: "unavailable" };
    return this.fixtures.get(addressKey(address)) ?? { kind: "not_found" };
  }
}

export class LocalDeliveryRouter implements DeliveryRoutingPort {
  private readonly fixtures: ReadonlyMap<string, RouteCalculationResult>;

  constructor(fixtures: readonly Readonly<{ origin: GeographicPoint; destination: GeographicPoint; result: RouteCalculationResult }>[]) {
    this.fixtures = new Map(fixtures.map(({ origin, destination, result }) => [`${pointKey(origin)}|${pointKey(destination)}`, result]));
  }

  async calculateRoute(origin: GeographicPoint, destination: GeographicPoint, signal: AbortSignal): Promise<RouteCalculationResult> {
    if (signal.aborted) return { kind: "unavailable" };
    return this.fixtures.get(`${pointKey(origin)}|${pointKey(destination)}`) ?? { kind: "not_found" };
  }
}
