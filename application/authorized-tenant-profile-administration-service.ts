import type { TrustedIdentity } from "../domain/authorization";
import type {
  TenantProfileMutationResult,
  UpdateTenantProfileCommand,
} from "../domain/tenant-profile-administration";
import { AuthorizationService } from "./authorization-service";
import { TenantProfileAdministrationService } from "./tenant-profile-administration-service";

export class AuthorizedTenantProfileAdministrationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly profiles: TenantProfileAdministrationService,
  ) {}

  async updateProfile(
    identity: TrustedIdentity,
    command: UpdateTenantProfileCommand,
  ): Promise<TenantProfileMutationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "tenant.profile.update",
    );
    return this.profiles.updateProfile(
      {
        id: access.principalId,
        role: access.role,
        tenantIds: [command.tenantId],
      },
      command,
    );
  }
}
