import type { TrustedIdentity } from "../domain/authorization";
import type { UpdateTenantOperationsCommand } from "../domain/tenant-operations-administration";
import { AuthorizationService } from "./authorization-service";
import { TenantOperationsAdministrationService } from "./tenant-operations-administration-service";

export class AuthorizedTenantOperationsAdministrationService {
  constructor(private readonly authorization: AuthorizationService, private readonly operations: TenantOperationsAdministrationService) {}

  async update(identity: TrustedIdentity, command: UpdateTenantOperationsCommand) {
    const access = await this.authorization.authorizeTenant(identity, command.tenantId, "tenant.operations.update");
    return this.operations.update({ id: access.principalId, role: access.role, tenantIds: [command.tenantId] }, command);
  }
}
