import type { CatalogActor } from "../domain/catalog-administration";
import type { CreateProductCommand, ProductCreationResult } from "../domain/product-creation";

export interface ProductCreationRepository {
  createProduct(
    actor: CatalogActor,
    command: CreateProductCommand,
  ): Promise<ProductCreationResult>;
}
