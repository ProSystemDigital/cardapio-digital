import { isCatalogScopedToTenant, type TenantCatalog } from "../domain/catalog";
import { demoCatalogs } from "./demo-catalogs";

export interface CatalogRepository {
  findByTenantSlug(slug: string): Promise<TenantCatalog | null>;
  listTenantSlugs(): Promise<readonly string[]>;
}

export class InMemoryCatalogRepository implements CatalogRepository {
  readonly #catalogsBySlug: ReadonlyMap<string, TenantCatalog>;

  constructor(catalogs: readonly TenantCatalog[]) {
    const validCatalogs = catalogs.filter(isCatalogScopedToTenant);
    const slugs = new Set(validCatalogs.map((catalog) => catalog.tenant.slug));

    if (validCatalogs.length !== catalogs.length) {
      throw new Error("Catálogo rejeitado por violar o escopo do tenant.");
    }

    if (slugs.size !== validCatalogs.length) {
      throw new Error("Catálogo rejeitado por possuir slug de tenant duplicado.");
    }

    this.#catalogsBySlug = new Map(
      validCatalogs.map((catalog) => [catalog.tenant.slug, catalog]),
    );
  }

  async findByTenantSlug(slug: string): Promise<TenantCatalog | null> {
    return this.#catalogsBySlug.get(slug) ?? null;
  }

  async listTenantSlugs(): Promise<readonly string[]> {
    return [...this.#catalogsBySlug.keys()];
  }
}

export const catalogRepository: CatalogRepository =
  new InMemoryCatalogRepository(demoCatalogs);
