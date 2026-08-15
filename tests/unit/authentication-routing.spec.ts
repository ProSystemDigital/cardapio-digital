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
  expect(page).not.toMatch(/userId|orgId|orgRole|permission/);
  expect(signIn).toContain('fallbackRedirectUrl="/admin"');
});

test("saída encerra explicitamente a sessão ativa e informa falhas", () => {
  const signOut = read("app/admin/sign-out-button.tsx");
  expect(signOut).toContain("useAuth()");
  expect(signOut).toContain("useClerk()");
  expect(signOut).toContain('signOut({ sessionId, redirectUrl: "/admin/sign-in" })');
  expect(signOut).toContain('role="alert"');
});
