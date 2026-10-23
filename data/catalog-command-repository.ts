import type {
  ArchiveProductCommand,
  CatalogActor,
  CatalogMutationResult,
  UpdateProductCommand,
} from "../domain/catalog-administration";

export interface CatalogCommandRepository {
  updateProduct(
    actor: CatalogActor,
    command: UpdateProductCommand,
  ): Promise<CatalogMutationResult>;
  archiveProduct?(
    actor: CatalogActor,
    command: ArchiveProductCommand,
  ): Promise<CatalogMutationResult>;
}
