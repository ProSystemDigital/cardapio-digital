import type { TenantCatalog } from "../domain/catalog";
import { validateCatalog } from "../domain/catalog-validation";
import { demoCatalogs } from "./demo-catalogs";

export interface CatalogRepository {
  findByTenantSlug(slug: string): Promise<TenantCatalog | null>;
  listTenantSlugs(): Promise<readonly string[]>;
}

export class InMemoryCatalogRepository implements CatalogRepository {
  readonly #catalogsBySlug: ReadonlyMap<string, TenantCatalog>;

  constructor(catalogs: readonly TenantCatalog[]) {
    const invalidCatalog = catalogs.find((catalog) => validateCatalog(catalog).length > 0);
    const slugs = new Set(catalogs.map((catalog) => catalog.tenant.slug));

    if (invalidCatalog) {
      throw new Error(
        `Catálogo ${invalidCatalog.tenant.slug} rejeitado: ${validateCatalog(invalidCatalog).join(" ")}`,
      );
    }

    if (slugs.size !== catalogs.length) {
      throw new Error("Catálogo rejeitado por possuir slug de tenant duplicado.");
    }

    this.#catalogsBySlug = new Map(
      catalogs.map((catalog) => [catalog.tenant.slug, catalog]),
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
