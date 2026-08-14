import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { AuthenticationSessionGateway } from "./authentication-repositories";
import type { VerifiedExternalSession } from "../domain/authentication";
import { mapClerkAuthToExternalSession } from "./clerk-session-mapper";

export class ClerkAuthenticationSessionGateway implements AuthenticationSessionGateway {
  async verifySession(): Promise<VerifiedExternalSession | null> {
    const result = await auth();
    return mapClerkAuthToExternalSession({
      userId: result.userId,
      sessionClaims: result.sessionClaims as Record<string, unknown> | null,
    });
  }
}
