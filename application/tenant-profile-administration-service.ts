import type { TenantProfileCommandRepository } from "../data/tenant-profile-command-repository";
import {
  authorizeTenantProfileMutation,
  validateUpdateTenantProfileCommand,
  type TenantProfileActor,
  type TenantProfileMutationResult,
  type UpdateTenantProfileCommand,
} from "../domain/tenant-profile-administration";

export class TenantProfileAdministrationService {
  constructor(private readonly repository: TenantProfileCommandRepository) {}

  async updateProfile(
    actor: TenantProfileActor,
    command: UpdateTenantProfileCommand,
  ): Promise<TenantProfileMutationResult> {
    authorizeTenantProfileMutation(actor, command.tenantId);
    validateUpdateTenantProfileCommand(command);
    return this.repository.updateProfile(actor, command);
  }
}
