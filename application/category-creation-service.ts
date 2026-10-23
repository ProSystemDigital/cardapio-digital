import type { CategoryCreationRepository } from "../data/category-creation-repository";
import {
  authorizeCategoryMutation,
  validateCreateCategoryCommand,
  type CategoryActor,
  type CategoryMutationResult,
  type CreateCategoryCommand,
} from "../domain/category-administration";

export class CategoryCreationService {
  constructor(private readonly repository: CategoryCreationRepository) {}

  async createCategory(
    actor: CategoryActor,
    command: CreateCategoryCommand,
  ): Promise<CategoryMutationResult> {
    authorizeCategoryMutation(actor, command.tenantId);
    validateCreateCategoryCommand(command);
    return this.repository.createCategory(actor, command);
  }
}
