import type { TenantFulfillmentCommandRepository } from "../data/tenant-fulfillment-command-repository";
import {
  authorizeTenantFulfillmentMutation,
  validateEnableTenantFulfillmentModeCommand,
  type EnableTenantFulfillmentModeCommand,
  type TenantFulfillmentActor,
  type TenantFulfillmentMutationResult,
} from "../domain/tenant-fulfillment-administration";

export class TenantFulfillmentAdministrationService {
  constructor(private readonly repository: TenantFulfillmentCommandRepository) {}

  async enableMode(
    actor: TenantFulfillmentActor,
    command: EnableTenantFulfillmentModeCommand,
  ): Promise<TenantFulfillmentMutationResult> {
    authorizeTenantFulfillmentMutation(actor, command.tenantId);
    validateEnableTenantFulfillmentModeCommand(command);
    return this.repository.enableMode(actor, command);
  }
}
