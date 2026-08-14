import type { CatalogCommandRepository } from "../data/catalog-command-repository";
import {
  authorizeCatalogMutation,
  validateUpdateProductCommand,
  type CatalogActor,
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
}
