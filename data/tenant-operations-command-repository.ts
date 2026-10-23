import type { TenantOperationsActor, TenantOperationsMutationResult, UpdateTenantOperationsCommand } from "../domain/tenant-operations-administration";

export interface TenantOperationsCommandRepository {
  updateOperations(actor: TenantOperationsActor, command: UpdateTenantOperationsCommand): Promise<TenantOperationsMutationResult>;
}
