import type { TenantOperationsCommandRepository } from "../data/tenant-operations-command-repository";
import { TenantOperationsAuthorizationError, validateTenantOperationsCommand, type TenantOperationsActor, type UpdateTenantOperationsCommand } from "../domain/tenant-operations-administration";

export class TenantOperationsAdministrationService {
  constructor(private readonly repository: TenantOperationsCommandRepository) {}

  update(actor: TenantOperationsActor, command: UpdateTenantOperationsCommand) {
    if ((actor.role !== "owner" && actor.role !== "manager") || !actor.tenantIds.includes(command.tenantId)) {
      throw new TenantOperationsAuthorizationError("Operação não autorizada.");
    }
    validateTenantOperationsCommand(command);
    return this.repository.updateOperations(actor, command);
  }
}
