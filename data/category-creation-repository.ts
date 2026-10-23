import type {
  CategoryActor,
  CategoryMutationResult,
  CreateCategoryCommand,
} from "../domain/category-administration";

export interface CategoryCreationRepository {
  createCategory(
    actor: CategoryActor,
    command: CreateCategoryCommand,
  ): Promise<CategoryMutationResult>;
}
