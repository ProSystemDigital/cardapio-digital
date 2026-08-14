export type CatalogRepositoryMode =
  | { kind: "memory" }
  | { kind: "postgres"; databaseUrl: string };

export function resolveCatalogRepositoryMode(input: {
  repository?: string;
  databaseUrl?: string;
}): CatalogRepositoryMode {
  const repository = input.repository?.trim();

  if (!repository || repository === "memory") {
    return { kind: "memory" };
  }
  if (repository !== "postgres") {
    throw new Error(`CATALOG_REPOSITORY inválido: ${repository}.`);
  }
  if (!input.databaseUrl?.trim()) {
    throw new Error("DATABASE_URL é obrigatória quando CATALOG_REPOSITORY=postgres.");
  }
  return { kind: "postgres", databaseUrl: input.databaseUrl };
}
