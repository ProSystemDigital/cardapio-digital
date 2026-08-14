import type { ExternalIdentityReference, VerifiedExternalSession } from "../domain/authentication";
import type { PrincipalId } from "../domain/authorization";

export interface AuthenticationSessionGateway {
  verifySession(): Promise<VerifiedExternalSession | null>;
}

export interface ExternalIdentityLinkRepository {
  resolvePrincipalId(identity: ExternalIdentityReference): Promise<PrincipalId | null>;
}
