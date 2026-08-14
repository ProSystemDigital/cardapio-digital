import type { TenantId, TenantRole } from "./catalog";

export type PrincipalId = string;
export type TrustedIdentity = Readonly<{ principalId: PrincipalId }>;

export type TenantPermission =
  | "catalog.read"
  | "catalog.product.update"
  | "tenant.operations.update"
  | "tenant.settings.update"
  | "tenant.memberships.manage"
  | "tenant.audit.read";

export type PlatformPermission =
  | "platform.tenants.read"
  | "platform.support_access.request";

export type PrincipalAccess = Readonly<{
  principalId: PrincipalId;
  tenantId?: TenantId;
  role: TenantRole;
}>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPrincipalId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const tenantPermissions: Readonly<Record<"owner" | "manager", ReadonlySet<TenantPermission>>> = {
  owner: new Set([
    "catalog.read",
    "catalog.product.update",
    "tenant.operations.update",
    "tenant.settings.update",
    "tenant.memberships.manage",
    "tenant.audit.read",
  ]),
  manager: new Set([
    "catalog.read",
    "catalog.product.update",
    "tenant.operations.update",
    "tenant.audit.read",
  ]),
};

const platformPermissions: ReadonlySet<PlatformPermission> = new Set([
  "platform.tenants.read",
  "platform.support_access.request",
]);

export function roleAllowsTenantPermission(
  role: TenantRole,
  permission: TenantPermission,
): boolean {
  if (role === "platform_admin") return false;
  return tenantPermissions[role].has(permission);
}

export function roleAllowsPlatformPermission(
  role: TenantRole,
  permission: PlatformPermission,
): boolean {
  return role === "platform_admin" && platformPermissions.has(permission);
}
