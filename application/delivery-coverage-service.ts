import type { DeliveryGeocodingPort, DeliveryRoutingPort } from "../data/delivery-location-ports";
import { MAX_DELIVERY_DISTANCE_IN_METERS, MIN_DELIVERY_DISTANCE_IN_METERS } from "../domain/tenant-operations-administration";
import {
  DELIVERY_COVERAGE_TIMEOUT_IN_MS,
  DeliveryCoverageValidationError,
  normalizeBrazilianDeliveryAddress,
  validateBrazilianDeliveryAddress,
  validateGeographicPoint,
  type BrazilianDeliveryAddress,
  type DeliveryCoverageResult,
  type GeographicPoint,
} from "../domain/delivery-coverage";

export class DeliveryCoverageService {
  constructor(
    private readonly geocoding: DeliveryGeocodingPort,
    private readonly routing: DeliveryRoutingPort,
    private readonly timeoutInMs = DELIVERY_COVERAGE_TIMEOUT_IN_MS,
  ) {}

  async evaluate(input: Readonly<{
    origin: GeographicPoint;
    destination: BrazilianDeliveryAddress;
    maximumDistanceInMeters: number;
  }>): Promise<DeliveryCoverageResult> {
    validateGeographicPoint(input.origin);
    if (!Number.isSafeInteger(input.maximumDistanceInMeters) ||
        input.maximumDistanceInMeters < MIN_DELIVERY_DISTANCE_IN_METERS ||
        input.maximumDistanceInMeters > MAX_DELIVERY_DISTANCE_IN_METERS) {
      throw new DeliveryCoverageValidationError("Limite de entrega inválido.");
    }
    const destination = normalizeBrazilianDeliveryAddress(input.destination);
    validateBrazilianDeliveryAddress(destination);
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.evaluateUsingPorts(input.origin, destination, input.maximumDistanceInMeters, controller.signal),
        new Promise<DeliveryCoverageResult>((resolve) => {
          timeout = setTimeout(() => {
            controller.abort();
            resolve({ kind: "temporarily_unavailable" });
          }, this.timeoutInMs);
        }),
      ]);
    } catch {
      return { kind: "temporarily_unavailable" };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private async evaluateUsingPorts(
    origin: GeographicPoint,
    destination: BrazilianDeliveryAddress,
    maximumDistanceInMeters: number,
    signal: AbortSignal,
  ): Promise<DeliveryCoverageResult> {
      const geocoded = await this.geocoding.geocode(destination, signal);
      if (geocoded.kind === "ambiguous") return { kind: "address_ambiguous" };
      if (geocoded.kind === "not_found") return { kind: "address_not_found" };
      if (geocoded.kind === "unavailable") return { kind: "temporarily_unavailable" };
      validateGeographicPoint(geocoded.point);
      const route = await this.routing.calculateRoute(origin, geocoded.point, signal);
      if (route.kind === "not_found") return { kind: "route_not_found" };
      if (route.kind === "unavailable") return { kind: "temporarily_unavailable" };
      if (!Number.isSafeInteger(route.distanceInMeters) || route.distanceInMeters < 0 ||
          !Number.isSafeInteger(route.durationInSeconds) || route.durationInSeconds < 0) {
        return { kind: "temporarily_unavailable" };
      }
      return {
        kind: route.distanceInMeters <= maximumDistanceInMeters ? "covered" : "outside_coverage",
        distanceInMeters: route.distanceInMeters,
        durationInSeconds: route.durationInSeconds,
      };
  }
}
