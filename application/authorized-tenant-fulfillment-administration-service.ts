import type { TrustedIdentity } from "../domain/authorization";
import type {
  EnableTenantFulfillmentModeCommand,
  TenantFulfillmentMutationResult,
} from "../domain/tenant-fulfillment-administration";
import { AuthorizationService } from "./authorization-service";
import { TenantFulfillmentAdministrationService } from "./tenant-fulfillment-administration-service";

export class AuthorizedTenantFulfillmentAdministrationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly fulfillment: TenantFulfillmentAdministrationService,
  ) {}

  async enableMode(
    identity: TrustedIdentity,
    command: EnableTenantFulfillmentModeCommand,
  ): Promise<TenantFulfillmentMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "tenant.fulfillment_modes.update",
    );
    return this.fulfillment.enableMode(
      {
        id: access.principalId,
        role: access.role,
        tenantIds: [command.tenantId],
      },
      command,
    );
  }
}
