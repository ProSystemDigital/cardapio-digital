import type { TrustedIdentity } from "../domain/authorization";
import type {
  CategoryMutationResult,
  CreateCategoryCommand,
} from "../domain/category-administration";
import { AuthorizationService } from "./authorization-service";
import { CategoryCreationService } from "./category-creation-service";

export class AuthorizedCategoryCreationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly categories: CategoryCreationService,
  ) {}

  async createCategory(
    identity: TrustedIdentity,
    command: CreateCategoryCommand,
  ): Promise<CategoryMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.category.create",
    );
    return this.categories.createCategory(
      {
        id: access.principalId,
        role: access.role,
        tenantIds: [command.tenantId],
      },
      command,
    );
  }
}
