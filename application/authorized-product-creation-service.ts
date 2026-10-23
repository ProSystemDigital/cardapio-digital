import type { TrustedIdentity } from "../domain/authorization";
import type { CreateProductCommand, ProductCreationResult } from "../domain/product-creation";
import { AuthorizationService } from "./authorization-service";
import { ProductCreationService } from "./product-creation-service";

export class AuthorizedProductCreationService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly products: ProductCreationService,
  ) {}

  async createProduct(
    identity: TrustedIdentity,
    command: CreateProductCommand,
  ): Promise<ProductCreationResult> {
    const access = await this.authorization.authorizeTenant(
      identity,
      command.tenantId,
      "catalog.product.create",
    );
    return this.products.createProduct(
      { id: access.principalId, role: access.role, tenantIds: [command.tenantId] },
      command,
    );
  }
}
