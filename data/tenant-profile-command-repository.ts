import type {
  TenantProfileActor,
  TenantProfileMutationResult,
  UpdateTenantProfileCommand,
} from "../domain/tenant-profile-administration";

export interface TenantProfileCommandRepository {
  updateProfile(
    actor: TenantProfileActor,
    command: UpdateTenantProfileCommand,
  ): Promise<TenantProfileMutationResult>;
}
