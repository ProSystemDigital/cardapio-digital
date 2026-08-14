import type { AuthorizationRepository } from "../data/authorization-repository";
import {
  roleAllowsPlatformPermission,
  roleAllowsTenantPermission,
  isValidPrincipalId,
  type PlatformPermission,
  type PrincipalAccess,
  type TenantPermission,
  type TrustedIdentity,
} from "../domain/authorization";
import type { TenantId } from "../domain/catalog";

export class AccessDeniedError extends Error {}

export class AuthorizationService {
  constructor(private readonly repository: AuthorizationRepository) {}

  async authorizeTenant(
    identity: TrustedIdentity,
    tenantId: TenantId,
    permission: TenantPermission,
  ): Promise<PrincipalAccess> {
    if (!isValidPrincipalId(identity.principalId)) {
      throw new AccessDeniedError("Identidade confiável inválida.");
    }
    const access = await this.repository.resolveTenantAccess(identity.principalId, tenantId);
    if (!access || !roleAllowsTenantPermission(access.role, permission)) {
      throw new AccessDeniedError("Acesso ao tenant negado.");
    }
    return access;
  }

  async authorizePlatform(
    identity: TrustedIdentity,
    permission: PlatformPermission,
  ): Promise<PrincipalAccess> {
    if (!isValidPrincipalId(identity.principalId)) {
      throw new AccessDeniedError("Identidade confiável inválida.");
    }
    const access = await this.repository.resolvePlatformAccess(identity.principalId);
    if (!access || !roleAllowsPlatformPermission(access.role, permission)) {
      throw new AccessDeniedError("Acesso à plataforma negado.");
    }
    return access;
  }
}
