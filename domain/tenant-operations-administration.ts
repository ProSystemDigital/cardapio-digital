import type { PaymentMethod, TenantId, TenantRole, Weekday } from "./catalog";
import { isBrazilianMobileWhatsapp } from "./brazilian-whatsapp";
export type { PaymentMethod } from "./catalog";

export const MAX_OPERATION_AMOUNT_IN_CENTS = 99_999_999;
export const MIN_DELIVERY_DISTANCE_IN_METERS = 500;
export const MAX_DELIVERY_DISTANCE_IN_METERS = 200_000;
export const PAYMENT_METHODS = ["pix", "cash", "credit_card", "debit_card"] as const;
export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const MAX_DINING_TABLES = 100;
export const MAX_DINING_TABLE_LABEL_LENGTH = 30;
export const MAX_DINING_ENVIRONMENT_LENGTH = 40;

export type TenantOperationsActor = Readonly<{ id: string; role: TenantRole; tenantIds: readonly TenantId[] }>;
export type OperationalHoursInput = Readonly<{ weekday: Weekday; opensAt: string; closesAt: string }>;
type TenantOperationsCommandContext = Readonly<{
  tenantId: TenantId;
  expectedVersion: number;
}>;
export type UpdateTenantOperationsCommand = TenantOperationsCommandContext & Readonly<{
  section: "attendance";
  whatsappNumber: string;
  businessHours: readonly OperationalHoursInput[];
} | {
  section: "tables";
  diningTables: readonly string[];
} | {
  section: "finance";
  minimumOrderInCents: number;
  paymentMethods: readonly PaymentMethod[];
} | {
  section: "logistics";
  deliveryFeeInCents: number;
  maximumDeliveryDistanceInMeters: number;
}>;
export type TenantOperationsMutationResult = Readonly<{ tenantId: TenantId; version: number }>;

export class TenantOperationsAuthorizationError extends Error {}
export class TenantOperationsValidationError extends Error {}
export class TenantOperationsConflictError extends Error {}
export class TenantOperationsNotFoundError extends Error {}

const TENANT_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validateTenantOperationsCommand(command: UpdateTenantOperationsCommand): void {
  if (!TENANT_UUID_PATTERN.test(command.tenantId) || !Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new TenantOperationsValidationError("Contexto operacional inválido.");
  }
  if (command.section === "attendance") {
    if (!isBrazilianMobileWhatsapp(command.whatsappNumber)) {
      throw new TenantOperationsValidationError("WhatsApp deve ser um celular brasileiro com DDD.");
    }
    if (command.businessHours.length !== new Set(command.businessHours.map(({ weekday }) => weekday)).size ||
        command.businessHours.some(({ weekday, opensAt, closesAt }) =>
          !WEEKDAYS.includes(weekday) || !TIME_PATTERN.test(opensAt) || !TIME_PATTERN.test(closesAt) || opensAt >= closesAt)) {
      throw new TenantOperationsValidationError("Horários semanais inválidos.");
    }
  } else if (command.section === "tables") {
    const tableParts = command.diningTables.map((label) => label.split(" · "));
    if (command.diningTables.length > MAX_DINING_TABLES ||
        new Set(command.diningTables.map((label) => label.toLocaleLowerCase("pt-BR"))).size !== command.diningTables.length ||
        tableParts.some((parts) => parts.length !== 2 || !parts[0].trim() || !parts[1].trim() ||
          parts[0].length > MAX_DINING_ENVIRONMENT_LENGTH || parts[1].length > MAX_DINING_TABLE_LABEL_LENGTH)) {
      throw new TenantOperationsValidationError("Identificações de mesas inválidas.");
    }
  } else if (command.section === "finance") {
    if (!Number.isSafeInteger(command.minimumOrderInCents) || command.minimumOrderInCents < 0 ||
        command.minimumOrderInCents > MAX_OPERATION_AMOUNT_IN_CENTS) {
      throw new TenantOperationsValidationError("Valor operacional inválido.");
    }
    if (command.paymentMethods.length < 1 || new Set(command.paymentMethods).size !== command.paymentMethods.length ||
        command.paymentMethods.some((method) => !PAYMENT_METHODS.includes(method))) {
      throw new TenantOperationsValidationError("Selecione meios de pagamento válidos.");
    }
  } else {
    if (!Number.isSafeInteger(command.deliveryFeeInCents) || command.deliveryFeeInCents < 0 ||
        command.deliveryFeeInCents > MAX_OPERATION_AMOUNT_IN_CENTS) {
      throw new TenantOperationsValidationError("Valor operacional inválido.");
    }
    if (!Number.isSafeInteger(command.maximumDeliveryDistanceInMeters) ||
        command.maximumDeliveryDistanceInMeters < MIN_DELIVERY_DISTANCE_IN_METERS ||
        command.maximumDeliveryDistanceInMeters > MAX_DELIVERY_DISTANCE_IN_METERS) {
      throw new TenantOperationsValidationError("Distância máxima para entrega inválida.");
    }
  }
}
