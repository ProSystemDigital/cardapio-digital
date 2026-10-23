import type {
  ArchiveCategoryCommand,
  CategoryActor,
  CategoryMutationResult,
  UpdateCategoryCommand,
} from "../domain/category-administration";

export interface CategoryCommandRepository {
  updateCategory(
    actor: CategoryActor,
    command: UpdateCategoryCommand,
  ): Promise<CategoryMutationResult>;
  archiveCategory(actor: CategoryActor, command: ArchiveCategoryCommand): Promise<CategoryMutationResult>;
}
