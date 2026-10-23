import type { TenantId, TenantRole } from "./catalog";
import { normalizeBrazilianDeliveryAddress, validateBrazilianDeliveryAddress } from "./delivery-coverage";

export type DeliveryOriginActor = Readonly<{ id: string; role: TenantRole; tenantIds: readonly TenantId[] }>;
export type SaveDeliveryOriginCommand = Readonly<{
  tenantId: TenantId;
  expectedVersion: number | null;
  label: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}>;
export type DeliveryOriginMutationResult = Readonly<{ tenantId: TenantId; version: number; geocodingStatus: "pending" }>;

export interface DeliveryOriginCommandPort {
  save(actor: DeliveryOriginActor, command: SaveDeliveryOriginCommand): Promise<DeliveryOriginMutationResult>;
}

export class DeliveryOriginValidationError extends Error {}
export class DeliveryOriginAuthorizationError extends Error {}
export class DeliveryOriginConflictError extends Error {}
export class DeliveryOriginNotFoundError extends Error {}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function clean(value: string): string { return value.trim().replace(/\s+/g, " "); }

export class DeliveryOriginAdministrationService {
  constructor(private readonly port: DeliveryOriginCommandPort) {}

  async save(actor: DeliveryOriginActor, input: SaveDeliveryOriginCommand): Promise<DeliveryOriginMutationResult> {
    if ((actor.role !== "owner" && actor.role !== "manager") || !actor.tenantIds.includes(input.tenantId)) {
      throw new DeliveryOriginAuthorizationError("Ator sem acesso à origem logística.");
    }
    if (!UUID_PATTERN.test(actor.id) || !UUID_PATTERN.test(input.tenantId) ||
        (input.expectedVersion !== null && (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1))) {
      throw new DeliveryOriginValidationError("Contexto da origem inválido.");
    }
    const label = clean(input.label);
    const neighborhood = clean(input.neighborhood);
    const complement = input.complement ? clean(input.complement) : undefined;
    if (!label || label.length > 80 || !neighborhood || neighborhood.length > 80 || (complement && complement.length > 80)) {
      throw new DeliveryOriginValidationError("Identificação da origem inválida.");
    }
    const address = normalizeBrazilianDeliveryAddress({
      postalCode: input.postalCode, street: input.street, number: input.number,
      city: input.city, state: input.state, country: "BR",
    });
    try { validateBrazilianDeliveryAddress(address); } catch { throw new DeliveryOriginValidationError("Endereço da origem inválido."); }
    return this.port.save(actor, {
      ...input, label, neighborhood, complement,
      postalCode: address.postalCode, street: address.street, number: address.number,
      city: address.city, state: address.state,
    });
  }
}
