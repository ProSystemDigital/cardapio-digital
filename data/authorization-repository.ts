import type {
  PrincipalAccess,
  PrincipalId,
} from "../domain/authorization";
import type { TenantId } from "../domain/catalog";

export interface AuthorizationRepository {
  listTenantAccess(principalId: PrincipalId): Promise<readonly PrincipalAccess[]>;
  resolveTenantAccess(
    principalId: PrincipalId,
    tenantId: TenantId,
  ): Promise<PrincipalAccess | null>;
  resolvePlatformAccess(principalId: PrincipalId): Promise<PrincipalAccess | null>;
}
