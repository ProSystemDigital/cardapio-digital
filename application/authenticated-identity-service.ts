import type {
  AuthenticationSessionGateway,
  ExternalIdentityLinkRepository,
} from "../data/authentication-repositories";
import { normalizeExternalIdentity, toTrustedIdentity } from "../domain/authentication";
import { isValidPrincipalId, type TrustedIdentity } from "../domain/authorization";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Autenticação necessária.");
  }
}

export class AuthenticatedIdentityService {
  constructor(
    private readonly sessionGateway: AuthenticationSessionGateway,
    private readonly linkRepository: ExternalIdentityLinkRepository,
    private readonly nowEpochSeconds: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  async resolveTrustedIdentity(): Promise<TrustedIdentity> {
    const session = await this.sessionGateway.verifySession();
    if (!session || !Number.isSafeInteger(session.expiresAtEpochSeconds)) {
      throw new AuthenticationRequiredError();
    }

    const identity = normalizeExternalIdentity(session);
    if (!identity || session.expiresAtEpochSeconds <= this.nowEpochSeconds()) {
      throw new AuthenticationRequiredError();
    }

    const principalId = await this.linkRepository.resolvePrincipalId(identity);
    if (!principalId || !isValidPrincipalId(principalId)) {
      throw new AuthenticationRequiredError();
    }

    return toTrustedIdentity(principalId);
  }
}
