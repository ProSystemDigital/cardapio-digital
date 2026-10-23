import type { TrustedIdentity } from "../domain/authorization";
import type { SaveTenantPrivacyCommand } from "../domain/tenant-privacy-administration";
import { TenantPrivacyAdministrationService } from "../domain/tenant-privacy-administration";
import { AuthorizationService } from "./authorization-service";

export class AuthorizedTenantPrivacyAdministrationService {
  constructor(private readonly authorization: AuthorizationService, private readonly privacy: TenantPrivacyAdministrationService) {}
  async save(identity: TrustedIdentity, command: SaveTenantPrivacyCommand) {
    const access = await this.authorization.authorizeTenant(identity, command.tenantId, "tenant.privacy.update");
    return this.privacy.save({ id: access.principalId, role: access.role, tenantIds: [command.tenantId] }, command);
  }
}
