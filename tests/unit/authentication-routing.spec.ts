import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

test("proxy inicializa Clerk somente no espaço administrativo", () => {
  const proxy = read("proxy.ts");
  expect(proxy).toContain("clerkMiddleware()");
  expect(proxy).not.toContain("createRouteMatcher");
  expect(proxy).not.toContain("auth.protect()");
  expect(proxy).toContain('matcher: ["/admin/:path*", "/api/admin/:path*"]');
});

test("página administrativa exige autenticação sem consumir papéis externos", () => {
  const page = read("app/admin/page.tsx");
  const signIn = read("app/admin/sign-in/[[...sign-in]]/page.tsx");
  expect(page).toContain("await auth.protect()");
  expect(page).toContain("await resolveCurrentIdentity()");
  expect(page).toContain("await resolveCurrentTenantAccess(identity.identity)");
  expect(page).toContain('identity.kind === "denied"');
  expect(page).toContain("tenantAccess.length !== 1");
  expect(page).toContain("await Promise.all([");
  expect(page).toContain("loadDerivedTenantCatalog(tenantId)");
  expect(page).toContain("<AvailabilityForm");
  expect(page).toContain("<PriceForm");
  expect(page).toContain("<ContentForm");
  expect(page).toContain("<CategoryForm");
  expect(page).toContain("<FulfillmentModesForm");
  expect(page).toContain("productCountByCategory");
  expect(page).toContain("catalog.categories.map");
  expect(page).toContain("A ordem e os nomes das categorias ainda não podem ser alterados");
  expect(page).toContain("fulfillmentModeLabels");
  expect(page).toContain("product.fulfillmentModes.map");
  expect(page).toContain('aria-label="Modalidades habilitadas"');
  expect(page).toContain("loadAuthorizedCatalogAudit(identity.identity, tenantId)");
  expect(page).not.toMatch(/searchParams|params\s*:/);
  expect(page).not.toMatch(/userId|orgId|orgRole|permission/);
  expect(signIn).toContain('fallbackRedirectUrl="/admin"');
});

test("resolução real falha fechada sem banco ou vínculo", () => {
  const composition = read("data/authentication.server.ts");
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain("if (!databaseUrl) return null");
  expect(composition).toContain('return { kind: "denied" }');
  expect(composition).not.toMatch(/userId|orgId|orgRole|tenantIds/);
});

test("saída encerra explicitamente a sessão ativa e informa falhas", () => {
  const signOut = read("app/admin/sign-out-button.tsx");
  expect(signOut).toContain("useAuth()");
  expect(signOut).toContain("useClerk()");
  expect(signOut).toContain('signOut({ sessionId, redirectUrl: "/admin/sign-in" })');
  expect(signOut).toContain('role="alert"');
});

test("provisionamento local não imprime identidade ou credencial", () => {
  const executor = read("scripts/database/manage-local-admin-link.mjs");
  const wrapper = read("scripts/database/manage-local-admin-link.ps1");
  expect(wrapper).toContain('Read-Host "Senha local do PostgreSQL" -AsSecureString');
  expect(wrapper).toContain("Remove-Item Env:\\CARDAPIO_DB_ADMIN_PASSWORD");
  expect(executor).toContain("users.length !== 1");
  expect(executor).toContain("[identity.issuer, identity.subject, principalId]");
  expect(executor).not.toMatch(/console\.log\([^)]*(issuer|subject|password|databaseUrl)/i);
  expect(executor).toContain('mode: 0o600');
  expect(executor).toContain('action === "enablecatalogread"');
  expect(executor).toContain('action === "enablecatalogavailabilitywrite"');
  expect(executor).toContain('action === "enablecatalogpricewrite"');
  expect(executor).toContain('action === "enablecatalogauditread"');
  expect(executor).toContain('action === "enablecatalogcontentwrite"');
  expect(executor).toContain('action === "enablecatalogcategoryassignmentwrite"');
  expect(executor).toContain('action === "enablecatalogfulfillmentmodeswrite"');
  expect(executor).toContain("GRANT SELECT ON TABLE");
  expect(executor).toContain("GRANT UPDATE (is_available, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (base_price_in_cents, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (name, description, version, updated_at)");
  expect(executor).toContain("GRANT UPDATE (category_id, version, updated_at)");
  expect(executor).toContain("GRANT INSERT, DELETE ON TABLE product_fulfillment_modes");
  expect(executor).toContain("Categoria de validação");
  expect(executor).toContain("GRANT INSERT ON TABLE catalog_audit_events");
  expect(executor).not.toContain("GRANT UPDATE (is_available, base_price_in_cents");
  expect(executor).not.toMatch(/GRANT\s+(INSERT|UPDATE|DELETE).*readableTables/i);
});

test("auditoria administrativa é autorizada, limitada e não expõe ator técnico", () => {
  const page = read("app/admin/page.tsx");
  const composition = read("data/admin-catalog-audit.server.ts");
  const repository = read("data/postgres-catalog-audit-repository.ts");
  expect(composition).toContain('authorizeTenant(identity, tenantId, "tenant.audit.read")');
  expect(composition).toContain("AUDIT_EVENT_LIMIT = 20");
  expect(repository).toContain("BEGIN READ ONLY");
  expect(repository).toContain("set_config('app.tenant_id'");
  expect(repository).toContain("LIMIT $2");
  expect(page).not.toMatch(/actorId|issuer|subject|userId/);
  expect(page).not.toMatch(/searchParams|params\s*:/);
});

test("mutação de disponibilidade deriva identidade e tenant novamente no servidor", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/availability-form.tsx");
  expect(action).toContain("await auth.protect()");
  expect(action).toContain("await resolveCurrentIdentity()");
  expect(action).toContain("await resolveCurrentTenantAccess(identity.identity)");
  expect(action).toContain("access.length !== 1");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('name="confirmed" required');
  expect(form).toContain('name="expectedVersion"');
  expect(form).toContain('name="isAvailable"');
});

test("edição de preço converte reais em centavos e não aceita contexto de autorização", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/price-form.tsx");
  expect(action).toContain("parsePriceInCents");
  expect(action).toContain("MAX_PRODUCT_PRICE_IN_CENTS");
  expect(action).toContain("await updateDerivedProductPrice");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('inputMode="decimal"');
  expect(form).toContain('name="confirmed" required');
  expect(form).toContain('name="expectedVersion"');
});

test("edição de conteúdo limita campos e renova autorização no servidor", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/content-form.tsx");
  expect(action).toContain("await updateDerivedProductContent");
  expect(action).toContain("MAX_PRODUCT_NAME_LENGTH");
  expect(action).toContain("MAX_PRODUCT_DESCRIPTION_LENGTH");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('maxLength={120}');
  expect(form).toContain('maxLength={500}');
  expect(form).toContain('name="confirmed" required');
  expect(form).toContain('name="expectedVersion"');
});

test("classificação de produto aceita somente categoria técnica e contexto derivado", () => {
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/category-form.tsx");
  const repository = read("data/postgres-catalog-command-repository.ts");
  expect(action).toContain("await updateDerivedProductCategory");
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('name="categoryId" required');
  expect(form).toContain('name="confirmed" required');
  expect(repository).toContain("FROM categories WHERE tenant_id = $1 AND id = $2");
  expect(repository).toContain("categoryName");
});

test("modalidades do produto usam conjunto do tenant e contexto derivado", () => {
  const page = read("app/admin/page.tsx");
  const action = read("app/admin/actions.ts");
  const form = read("app/admin/fulfillment-modes-form.tsx");
  const repository = read("data/postgres-catalog-command-repository.ts");
  expect(page).toContain("tenantModes={catalog.tenant.fulfillmentModes}");
  expect(action).toContain("await updateDerivedProductFulfillmentModes");
  expect(action).toContain('formData.getAll("fulfillmentModes")');
  expect(action).not.toMatch(/formData\.get\(["'](?:tenantId|role|actorId)/);
  expect(form).toContain('<fieldset>');
  expect(form).toContain('name="fulfillmentModes"');
  expect(form).toContain('name="confirmed" required');
  expect(repository).toContain("FROM tenant_fulfillment_modes WHERE tenant_id = $1");
  expect(repository).toContain("ANY($2::text[])");
  expect(repository).toContain("unnest($3::text[])");
  expect(repository).not.toContain("fulfillment_mode[]");
  expect(repository).toContain("DELETE FROM product_fulfillment_modes");
});
