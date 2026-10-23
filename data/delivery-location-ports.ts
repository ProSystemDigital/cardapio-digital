import type { BrazilianDeliveryAddress, GeographicPoint } from "../domain/delivery-coverage";

export type GeocodingResult =
  | Readonly<{ kind: "found"; point: GeographicPoint }>
  | Readonly<{ kind: "ambiguous" }>
  | Readonly<{ kind: "not_found" }>
  | Readonly<{ kind: "unavailable" }>;

export type RouteCalculationResult =
  | Readonly<{ kind: "found"; distanceInMeters: number; durationInSeconds: number }>
  | Readonly<{ kind: "not_found" }>
  | Readonly<{ kind: "unavailable" }>;

export interface DeliveryGeocodingPort {
  geocode(address: BrazilianDeliveryAddress, signal: AbortSignal): Promise<GeocodingResult>;
}

export interface DeliveryRoutingPort {
  calculateRoute(origin: GeographicPoint, destination: GeographicPoint, signal: AbortSignal): Promise<RouteCalculationResult>;
}
