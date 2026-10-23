import type { TrustedIdentity } from "../domain/authorization";
import type { UploadCatalogImageCommand } from "../domain/catalog-image-administration";
import { AuthorizationService } from "./authorization-service";
import {
  CatalogImageAdministrationService,
  type CatalogImageAdministrationResult,
} from "./catalog-image-administration-service";

export class AuthorizedCatalogImageAdministrationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly images: CatalogImageAdministrationService,
  ) {}

  async upload(
    identity: TrustedIdentity,
    command: UploadCatalogImageCommand,
  ): Promise<CatalogImageAdministrationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.image.update",
    );
    return this.images.upload(
      { id: access.principalId, role: access.role, tenantIds: [command.tenantId] },
      command,
    );
  }
}
