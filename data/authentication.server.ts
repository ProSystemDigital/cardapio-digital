import "server-only";

import type { Pool } from "pg";
import { AuthenticatedIdentityService } from "../application/authenticated-identity-service";
import { ClerkAuthenticationSessionGateway } from "./clerk-authentication-session-gateway";
import { PostgresExternalIdentityLinkRepository } from "./postgres-external-identity-link-repository";

export function createAuthenticatedIdentityService(pool: Pool): AuthenticatedIdentityService {
  return new AuthenticatedIdentityService(
    new ClerkAuthenticationSessionGateway(),
    new PostgresExternalIdentityLinkRepository(pool),
  );
}
