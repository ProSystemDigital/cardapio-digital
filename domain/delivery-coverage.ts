export const DELIVERY_COVERAGE_TIMEOUT_IN_MS = 2_000;

export type BrazilianDeliveryAddress = Readonly<{
  postalCode: string;
  street: string;
  number: string;
  city: string;
  state: string;
  country: "BR";
}>;

export type GeographicPoint = Readonly<{ latitude: number; longitude: number }>;

export type DeliveryCoverageResult =
  | Readonly<{ kind: "covered"; distanceInMeters: number; durationInSeconds: number }>
  | Readonly<{ kind: "outside_coverage"; distanceInMeters: number; durationInSeconds: number }>
  | Readonly<{ kind: "address_ambiguous" | "address_not_found" | "route_not_found" | "temporarily_unavailable" }>;

export class DeliveryCoverageValidationError extends Error {}

const STATES = new Set(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]);

function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeBrazilianDeliveryAddress(input: BrazilianDeliveryAddress): BrazilianDeliveryAddress {
  return {
    postalCode: input.postalCode.replace(/\D/g, ""),
    street: cleanText(input.street),
    number: cleanText(input.number),
    city: cleanText(input.city),
    state: cleanText(input.state).toUpperCase(),
    country: "BR",
  };
}

export function validateBrazilianDeliveryAddress(address: BrazilianDeliveryAddress): void {
  if (!/^\d{8}$/.test(address.postalCode)) throw new DeliveryCoverageValidationError("CEP inválido.");
  if (!address.street || address.street.length > 120) throw new DeliveryCoverageValidationError("Logradouro inválido.");
  if (!address.number || address.number.length > 20) throw new DeliveryCoverageValidationError("Número inválido.");
  if (!address.city || address.city.length > 80) throw new DeliveryCoverageValidationError("Cidade inválida.");
  if (!STATES.has(address.state) || address.country !== "BR") throw new DeliveryCoverageValidationError("UF inválida.");
}

export function validateGeographicPoint(point: GeographicPoint): void {
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
      point.latitude < -90 || point.latitude > 90 || point.longitude < -180 || point.longitude > 180) {
    throw new DeliveryCoverageValidationError("Coordenada inválida.");
  }
}
