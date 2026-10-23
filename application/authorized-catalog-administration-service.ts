import type { TrustedIdentity } from "../domain/authorization";
import type {
  ArchiveProductCommand,
  CatalogMutationResult,
  UpdateProductCommand,
} from "../domain/catalog-administration";
import { AuthorizationService } from "./authorization-service";
import { CatalogAdministrationService } from "./catalog-administration-service";

export class AuthorizedCatalogAdministrationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly catalog: CatalogAdministrationService,
  ) {}

  async updateProduct(
    identity: TrustedIdentity,
    command: UpdateProductCommand,
  ): Promise<CatalogMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.product.update",
    );
    return this.catalog.updateProduct(
      {
        id: access.principalId,
        role: access.role,
        tenantIds: [command.tenantId],
      },
      command,
    );
  }

  async archiveProduct(identity: TrustedIdentity, command: ArchiveProductCommand): Promise<CatalogMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.product.archive",
    );
    return this.catalog.archiveProduct({
      id: access.principalId,
      role: access.role,
      tenantIds: [command.tenantId],
    }, command);
  }
}
