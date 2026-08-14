import { expect, test } from "@playwright/test";
import { resolveCatalogRepositoryMode } from "../../data/catalog-repository-mode";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("mantém memória quando a seleção não é informada", () => {
  expect(resolveCatalogRepositoryMode({})).toEqual({ kind: "memory" });
  expect(resolveCatalogRepositoryMode({ repository: "memory" })).toEqual({ kind: "memory" });
});

test("postgres exige configuração explícita e URL", () => {
  expect(() => resolveCatalogRepositoryMode({ repository: "postgres" })).toThrow(
    "DATABASE_URL é obrigatória",
  );
  expect(
    resolveCatalogRepositoryMode({
      repository: "postgres",
      databaseUrl: "postgresql://local-placeholder",
    }),
  ).toEqual({ kind: "postgres", databaseUrl: "postgresql://local-placeholder" });
});

test("valor desconhecido falha fechado sem fallback silencioso", () => {
  expect(() => resolveCatalogRepositoryMode({ repository: "automatic" })).toThrow(
    "CATALOG_REPOSITORY inválido",
  );
});

test("composição PostgreSQL permanece restrita ao servidor", () => {
  const composition = readFileSync(
    resolve(process.cwd(), "data", "catalog-repository.server.ts"),
    "utf8",
  );
  expect(composition).toMatch(/^import "server-only";/);
  expect(composition).toContain('from "./postgres-catalog-repository"');
});
