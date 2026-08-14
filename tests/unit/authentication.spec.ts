import { expect, test } from "@playwright/test";
import {
  AuthenticatedIdentityService,
  AuthenticationRequiredError,
} from "../../application/authenticated-identity-service";
import type {
  AuthenticationSessionGateway,
  ExternalIdentityLinkRepository,
} from "../../data/authentication-repositories";
import { mapClerkAuthToExternalSession } from "../../data/clerk-session-mapper";

const principalId = "41000000-0000-4000-8000-000000000001";
const validSession = {
  issuer: "https://identity.example.test/",
  subject: "external-user-123",
  expiresAtEpochSeconds: 2_000,
};

function createService(
  session: unknown,
  resolvedPrincipalId: string | null = principalId,
  calls: unknown[] = [],
) {
  const gateway: AuthenticationSessionGateway = {
    async verifySession() {
      return session as Awaited<ReturnType<AuthenticationSessionGateway["verifySession"]>>;
    },
  };
  const links: ExternalIdentityLinkRepository = {
    async resolvePrincipalId(identity) {
      calls.push(identity);
      return resolvedPrincipalId;
    },
  };
  return new AuthenticatedIdentityService(gateway, links, () => 1_000);
}

test("reduz sessão verificada a somente principalId interno", async () => {
  const calls: unknown[] = [];
  const service = createService({
    ...validSession,
    role: "owner",
    tenantIds: ["forjado-no-cliente"],
  }, principalId, calls);

  await expect(service.resolveTrustedIdentity()).resolves.toEqual({ principalId });
  expect(calls).toEqual([{ issuer: "https://identity.example.test", subject: "external-user-123" }]);
});

test("nega sessão ausente, expirada ou com emissor inseguro antes do vínculo", async () => {
  for (const session of [
    null,
    { ...validSession, expiresAtEpochSeconds: 1_000 },
    { ...validSession, issuer: "http://identity.example.test" },
    { ...validSession, subject: "\u0000forjado" },
  ]) {
    const calls: unknown[] = [];
    await expect(createService(session, principalId, calls).resolveTrustedIdentity())
      .rejects.toBeInstanceOf(AuthenticationRequiredError);
    expect(calls).toHaveLength(0);
  }
});

test("nega identidade externa sem vínculo e principal interno inválido", async () => {
  await expect(createService(validSession, null).resolveTrustedIdentity())
    .rejects.toBeInstanceOf(AuthenticationRequiredError);
  await expect(createService(validSession, "principal-invalido").resolveTrustedIdentity())
    .rejects.toBeInstanceOf(AuthenticationRequiredError);
});

test("adaptador Clerk expõe somente emissor, userId e expiração verificados", () => {
  const session = mapClerkAuthToExternalSession({
    userId: "user_clerk_123",
    sessionClaims: {
      iss: "https://clerk.example.test",
      sub: "subject-que-nao-deve-ser-confiado-separadamente",
      exp: 2_000,
      org_role: "org:admin",
      org_id: "tenant-forjado",
    },
  });

  expect(session).toEqual({
    issuer: "https://clerk.example.test",
    subject: "user_clerk_123",
    expiresAtEpochSeconds: 2_000,
  });
});
