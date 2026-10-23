import type { TrustedIdentity } from "../domain/authorization";
import type { SaveDeliveryOriginCommand } from "../domain/delivery-origin-administration";
import { DeliveryOriginAdministrationService } from "../domain/delivery-origin-administration";
import { AuthorizationService } from "./authorization-service";

export class AuthorizedDeliveryOriginAdministrationService {
  constructor(private readonly authorization: AuthorizationService, private readonly origin: DeliveryOriginAdministrationService) {}
  async save(identity: TrustedIdentity, command: SaveDeliveryOriginCommand) {
    const access = await this.authorization.authorizeTenant(identity, command.tenantId, "tenant.delivery_origin.update");
    return this.origin.save({ id: access.principalId, role: access.role, tenantIds: [command.tenantId] }, command);
  }
}
