import type { ProductCreationRepository } from "../data/product-creation-repository";
import type { CatalogActor } from "../domain/catalog-administration";
import {
  authorizeProductCreation,
  validateCreateProductCommand,
  type CreateProductCommand,
  type ProductCreationResult,
} from "../domain/product-creation";

export class ProductCreationService {
  constructor(private readonly repository: ProductCreationRepository) {}

  async createProduct(
    actor: CatalogActor,
    command: CreateProductCommand,
  ): Promise<ProductCreationResult> {
    authorizeProductCreation(actor, command.tenantId);
    validateCreateProductCommand(command);
    return this.repository.createProduct(actor, command);
  }
}
