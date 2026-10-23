import type {
  EnableTenantFulfillmentModeCommand,
  TenantFulfillmentActor,
  TenantFulfillmentMutationResult,
} from "../domain/tenant-fulfillment-administration";

export interface TenantFulfillmentCommandRepository {
  enableMode(
    actor: TenantFulfillmentActor,
    command: EnableTenantFulfillmentModeCommand,
  ): Promise<TenantFulfillmentMutationResult>;
}
