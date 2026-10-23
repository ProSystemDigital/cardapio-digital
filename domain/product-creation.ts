import {
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_PRODUCT_PRICE_IN_CENTS,
  authorizeCatalogMutation,
  CatalogValidationError,
  type CatalogActor,
} from "./catalog-administration";
import type { CategoryId, FulfillmentMode, ProductId, TenantId } from "./catalog";

export type CreateProductCommand = Readonly<{
  tenantId: TenantId;
  categoryId: CategoryId;
  name: string;
  description: string;
  priceInCents: number;
  isAvailable: boolean;
  fulfillmentModes: readonly FulfillmentMode[];
}>;

export type ProductCreationResult = Readonly<{
  tenantId: TenantId;
  productId: ProductId;
  version: 1;
  isAvailable: boolean;
}>;

export { CatalogValidationError as ProductCreationValidationError };

const ENTITY_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ALLOWED_MODES: readonly FulfillmentMode[] = ["dine_in", "pickup", "delivery"];

export function authorizeProductCreation(actor: CatalogActor, tenantId: TenantId): void {
  authorizeCatalogMutation(actor, tenantId);
}

export function validateCreateProductCommand(command: CreateProductCommand): void {
  if (!ENTITY_UUID_PATTERN.test(command.tenantId)) {
    throw new CatalogValidationError("Tenant inválido.");
  }
  if (!ENTITY_UUID_PATTERN.test(command.categoryId)) {
    throw new CatalogValidationError("Categoria inválida.");
  }
  if (!command.name.trim() || command.name.length > MAX_PRODUCT_NAME_LENGTH) {
    throw new CatalogValidationError("Nome do produto inválido.");
  }
  if (command.description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    throw new CatalogValidationError("Descrição do produto inválida.");
  }
  if (
    !Number.isSafeInteger(command.priceInCents) ||
    command.priceInCents < 0 ||
    command.priceInCents > MAX_PRODUCT_PRICE_IN_CENTS
  ) {
    throw new CatalogValidationError("Preço do produto inválido.");
  }
  if (
    (command.isAvailable && command.fulfillmentModes.length === 0) ||
    new Set(command.fulfillmentModes).size !== command.fulfillmentModes.length ||
    command.fulfillmentModes.some((mode) => !ALLOWED_MODES.includes(mode))
  ) {
    throw new CatalogValidationError("Modalidades do produto inválidas.");
  }
}
