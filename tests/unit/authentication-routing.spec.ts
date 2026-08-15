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
  expect(page).toContain('identity.kind === "denied"');
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
});
