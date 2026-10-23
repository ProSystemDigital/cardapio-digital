import type { CategoryCommandRepository } from "../data/category-command-repository";
import {
  authorizeCategoryMutation,
  validateArchiveCategoryCommand,
  validateUpdateCategoryCommand,
  type CategoryActor,
  type ArchiveCategoryCommand,
  type CategoryMutationResult,
  type UpdateCategoryCommand,
} from "../domain/category-administration";

export class CategoryAdministrationService {
  constructor(private readonly repository: CategoryCommandRepository) {}

  async updateCategory(
    actor: CategoryActor,
    command: UpdateCategoryCommand,
  ): Promise<CategoryMutationResult> {
    authorizeCategoryMutation(actor, command.tenantId);
    validateUpdateCategoryCommand(command);
    return this.repository.updateCategory(actor, command);
  }

  async archiveCategory(actor: CategoryActor, command: ArchiveCategoryCommand): Promise<CategoryMutationResult> {
    authorizeCategoryMutation(actor, command.tenantId);
    validateArchiveCategoryCommand(command);
    return this.repository.archiveCategory(actor, command);
  }
}
