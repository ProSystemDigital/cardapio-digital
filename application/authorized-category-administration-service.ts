import type { TrustedIdentity } from "../domain/authorization";
import type { ArchiveCategoryCommand, CategoryMutationResult, UpdateCategoryCommand } from "../domain/category-administration";
import { AuthorizationService } from "./authorization-service";
import { CategoryAdministrationService } from "./category-administration-service";

export class AuthorizedCategoryAdministrationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly categories: CategoryAdministrationService,
  ) {}

  async updateCategory(identity: TrustedIdentity, command: UpdateCategoryCommand): Promise<CategoryMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.category.update",
    );
    return this.categories.updateCategory(
      { id: access.principalId, role: access.role, tenantIds: [command.tenantId] },
      command,
    );
  }

  async archiveCategory(identity: TrustedIdentity, command: ArchiveCategoryCommand): Promise<CategoryMutationResult> {
    const access = await this.authorization.authorizeTenant(identity, command.tenantId, "catalog.category.archive");
    return this.categories.archiveCategory(
      { id: access.principalId, role: access.role, tenantIds: [command.tenantId] },
      command,
    );
  }
}
