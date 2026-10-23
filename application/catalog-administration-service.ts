import type { CatalogCommandRepository } from "../data/catalog-command-repository";
import {
  authorizeCatalogMutation,
  CatalogValidationError,
  validateArchiveProductCommand,
  validateUpdateProductCommand,
  type CatalogActor,
  type ArchiveProductCommand,
  type CatalogMutationResult,
  type UpdateProductCommand,
} from "../domain/catalog-administration";

export class CatalogAdministrationService {
  constructor(private readonly repository: CatalogCommandRepository) {}

  async updateProduct(
    actor: CatalogActor,
    command: UpdateProductCommand,
  ): Promise<CatalogMutationResult> {
    authorizeCatalogMutation(actor, command.tenantId);
    validateUpdateProductCommand(command);
    return this.repository.updateProduct(actor, command);
  }

  async archiveProduct(actor: CatalogActor, command: ArchiveProductCommand): Promise<CatalogMutationResult> {
    authorizeCatalogMutation(actor, command.tenantId);
    validateArchiveProductCommand(command);
    if (!this.repository.archiveProduct) throw new CatalogValidationError("Arquivamento indisponível.");
    return this.repository.archiveProduct(actor, command);
  }
}
