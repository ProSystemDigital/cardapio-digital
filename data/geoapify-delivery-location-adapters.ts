import type { BrazilianDeliveryAddress, GeographicPoint } from "../domain/delivery-coverage";
import type { DeliveryGeocodingPort, DeliveryRoutingPort, GeocodingResult, RouteCalculationResult } from "./delivery-location-ports";

const GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1";

type FetchLike = typeof fetch;
const PRECISE_RESULT_TYPES = new Set(["amenity", "building", "street"]);
const MINIMUM_ORIGIN_CONFIDENCE = 0.7;
const SAME_PLACE_RADIUS_IN_METERS = 50;

function isPoint(value: unknown): value is GeographicPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return typeof point.latitude === "number" && Number.isFinite(point.latitude) && point.latitude >= -90 && point.latitude <= 90 &&
    typeof point.longitude === "number" && Number.isFinite(point.longitude) && point.longitude >= -180 && point.longitude <= 180;
}

function addressText(address: BrazilianDeliveryAddress): string {
  return `${address.street}, ${address.number}, ${address.postalCode}, ${address.city} - ${address.state}, Brasil`;
}

function distanceInMeters(first: GeographicPoint, second: GeographicPoint): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(first.latitude)) *
    Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export class GeoapifyDeliveryGeocoder implements DeliveryGeocodingPort {
  constructor(private readonly apiKey: string, private readonly request: FetchLike = fetch) {}

  async geocode(address: BrazilianDeliveryAddress, signal: AbortSignal): Promise<GeocodingResult> {
    if (!this.apiKey.trim() || signal.aborted) return { kind: "unavailable" };
    const url = new URL(`${GEOAPIFY_BASE_URL}/geocode/search`);
    url.searchParams.set("text", addressText(address));
    url.searchParams.set("filter", "countrycode:br");
    url.searchParams.set("limit", "2");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", this.apiKey);
    try {
      const response = await this.request(url, { headers: { Accept: "application/json" }, signal });
      if (!response.ok) return { kind: "unavailable" };
      const payload = await response.json() as { results?: unknown[] };
      if (!Array.isArray(payload.results) || payload.results.length === 0) return { kind: "not_found" };
      const precise = payload.results.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const result = candidate as Record<string, unknown>;
        const rank = result.rank && typeof result.rank === "object" ? result.rank as Record<string, unknown> : null;
        const point = { latitude: result.lat, longitude: result.lon };
        return PRECISE_RESULT_TYPES.has(String(result.result_type)) && typeof rank?.confidence === "number" &&
          rank.confidence >= MINIMUM_ORIGIN_CONFIDENCE && isPoint(point)
          ? [{ point, confidence: rank.confidence, fullMatch: rank.match_type === "full_match" }]
          : [];
      });
      if (precise.length === 0) return { kind: "ambiguous" };
      const ranked = [...precise].sort((left, right) => Number(right.fullMatch) - Number(left.fullMatch) || right.confidence - left.confidence);
      const preferred = ranked[0];
      if (ranked.slice(1).some((candidate) => distanceInMeters(preferred.point, candidate.point) > SAME_PLACE_RADIUS_IN_METERS)) {
        return { kind: "ambiguous" };
      }
      return { kind: "found", point: preferred.point };
    } catch {
      return { kind: "unavailable" };
    }
  }
}

export class GeoapifyDeliveryRouter implements DeliveryRoutingPort {
  constructor(private readonly apiKey: string, private readonly request: FetchLike = fetch) {}

  async calculateRoute(origin: GeographicPoint, destination: GeographicPoint, signal: AbortSignal): Promise<RouteCalculationResult> {
    if (!this.apiKey.trim() || signal.aborted) return { kind: "unavailable" };
    const url = new URL(`${GEOAPIFY_BASE_URL}/routing`);
    url.searchParams.set("waypoints", `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`);
    url.searchParams.set("mode", "drive");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", this.apiKey);
    try {
      const response = await this.request(url, { headers: { Accept: "application/json" }, signal });
      if (!response.ok) return { kind: response.status === 404 ? "not_found" : "unavailable" };
      const payload = await response.json() as { results?: Array<{ distance?: unknown; time?: unknown }> };
      const route = payload.results?.[0];
      if (!route) return { kind: "not_found" };
      if (typeof route.distance !== "number" || !Number.isFinite(route.distance) || route.distance < 0 ||
          typeof route.time !== "number" || !Number.isFinite(route.time) || route.time < 0) return { kind: "unavailable" };
      return { kind: "found", distanceInMeters: Math.round(route.distance), durationInSeconds: Math.round(route.time) };
    } catch {
      return { kind: "unavailable" };
    }
  }
}
