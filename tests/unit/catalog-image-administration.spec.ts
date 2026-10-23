import { expect, test } from "@playwright/test";
import { CatalogImageAdministrationService } from "../../application/catalog-image-administration-service";
import { AuthorizedCatalogImageAdministrationService } from "../../application/authorized-catalog-image-administration-service";
import { AuthorizationService, AccessDeniedError } from "../../application/authorization-service";
import type { AuthorizationRepository } from "../../data/authorization-repository";
import type {
  CatalogImageMetadataRepository,
  CatalogImageObjectStorage,
  CatalogImageProcessor,
} from "../../data/catalog-image-upload-ports";
import {
  CatalogImageAuthorizationError,
  CatalogImageCompensationError,
  CatalogImageValidationError,
  MAX_SOURCE_IMAGE_BYTES,
  validateInspectedSourceImage,
  validateNormalizedCatalogImage,
  validateUploadCatalogImageCommand,
  type CatalogImageActor,
  type UploadCatalogImageCommand,
} from "../../domain/catalog-image-administration";

const tenantId = "10000000-0000-0000-0000-000000000001";
const productId = "12000000-0000-0000-0000-000000000001";
const actor: CatalogImageActor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "owner",
  tenantIds: [tenantId],
};
const sourceBytes = new Uint8Array([1, 2, 3]);
const command: UploadCatalogImageCommand = {
  tenantId,
  target: { kind: "product", productId },
  expectedVersion: null,
  altText: "Pizza de brócolis",
  source: { bytes: sourceBytes, declaredMediaType: "image/jpeg" },
};
const normalized = {
  bytes: new Uint8Array([4, 5]),
  mediaType: "image/webp" as const,
  byteSize: 2,
  widthPixels: 1200,
  heightPixels: 900,
  contentSha256: "a".repeat(64),
};

function createService(options?: { persistenceFails?: boolean; deletionFails?: boolean; previousKey?: string }) {
  const events: string[] = [];
  const processor: CatalogImageProcessor = {
    async inspectAndNormalize() {
      events.push("normalize");
      return {
        inspection: { mediaType: "image/jpeg", byteSize: 3, widthPixels: 1600, heightPixels: 1200 },
        normalized,
      };
    },
  };
  const storage: CatalogImageObjectStorage = {
    async put() {
      events.push("put");
      return {
        ...normalized,
        storageProvider: "vercel_blob",
        objectKey: "tenants/a/products/new.webp",
        publicUrl: "https://assets.example.test/tenants/a/products/new.webp",
      };
    },
    async delete(key) {
      events.push(`delete:${key}`);
      if (options?.deletionFails) throw new Error("delete failed");
    },
  };
  const repository: CatalogImageMetadataRepository = {
    async replace() {
      events.push("replace");
      if (options?.persistenceFails) throw new Error("database failed");
      return { tenantId, version: 1, previousObjectKey: options?.previousKey };
    },
  };
  return { service: new CatalogImageAdministrationService(processor, storage, repository), events };
}

test("aceita JPEG, PNG e WebP até 5 MB e exige alvo válido", () => {
  for (const mediaType of ["image/jpeg", "image/png", "image/webp"]) {
    expect(() => validateUploadCatalogImageCommand({
      ...command,
      source: { bytes: sourceBytes, declaredMediaType: mediaType },
    })).not.toThrow();
  }
  const invalid = [
    { ...command, source: { bytes: new Uint8Array(), declaredMediaType: "image/jpeg" } },
    { ...command, source: { bytes: new Uint8Array(MAX_SOURCE_IMAGE_BYTES + 1), declaredMediaType: "image/jpeg" } },
    { ...command, source: { bytes: sourceBytes, declaredMediaType: "image/gif" } },
    { ...command, target: { kind: "product" as const, productId: "forjado" } },
    { ...command, altText: " " },
  ];
  for (const candidate of invalid) {
    expect(() => validateUploadCatalogImageCommand(candidate)).toThrow(CatalogImageValidationError);
  }
});

test("valida conteúdo decodificado, dimensões e saída WebP por destino", () => {
  expect(() => validateInspectedSourceImage(
    { mediaType: "image/jpeg", byteSize: 3, widthPixels: 1600, heightPixels: 1200 },
    command.source,
  )).not.toThrow();
  expect(() => validateInspectedSourceImage(
    { mediaType: "image/png", byteSize: 3, widthPixels: 1600, heightPixels: 1200 },
    command.source,
  )).toThrow(CatalogImageValidationError);
  expect(() => validateInspectedSourceImage(
    { mediaType: "image/jpeg", byteSize: 3, widthPixels: 9000, heightPixels: 1 },
    command.source,
  )).toThrow(CatalogImageValidationError);
  expect(() => validateNormalizedCatalogImage(command.target, normalized)).not.toThrow();
  expect(() => validateNormalizedCatalogImage(
    { kind: "tenant_logo" },
    normalized,
  )).toThrow(CatalogImageValidationError);
});

test("autoriza tenant, normaliza antes de armazenar e persiste metadados confiáveis", async () => {
  const { service, events } = createService();
  await expect(service.upload(actor, command)).resolves.toEqual({
    tenantId,
    version: 1,
    previousObjectCleanupPending: false,
  });
  expect(events).toEqual(["normalize", "put", "replace"]);
  await expect(service.upload({ ...actor, tenantIds: [] }, command)).rejects.toBeInstanceOf(
    CatalogImageAuthorizationError,
  );
  await expect(service.upload({ ...actor, role: "platform_admin" }, command)).rejects.toBeInstanceOf(
    CatalogImageAuthorizationError,
  );
});

test("composição deriva ator e permissão de imagem antes do processamento", async () => {
  const { service, events } = createService();
  const repository: AuthorizationRepository = {
    async listTenantAccess() { return []; },
    async resolveTenantAccess(receivedPrincipalId, receivedTenantId) {
      return { principalId: receivedPrincipalId, tenantId: receivedTenantId, role: "manager" };
    },
    async resolvePlatformAccess() { return null; },
  };
  const authorized = new AuthorizedCatalogImageAdministrationService(
    new AuthorizationService(repository),
    service,
  );
  await expect(authorized.upload({ principalId: actor.id }, command)).resolves.toMatchObject({ version: 1 });
  expect(events[0]).toBe("normalize");

  const deniedRepository: AuthorizationRepository = {
    ...repository,
    async resolveTenantAccess() { return null; },
  };
  const denied = new AuthorizedCatalogImageAdministrationService(
    new AuthorizationService(deniedRepository),
    createService().service,
  );
  await expect(denied.upload({ principalId: actor.id }, command)).rejects.toBeInstanceOf(AccessDeniedError);
});

test("remove objeto novo quando a persistência falha", async () => {
  const { service, events } = createService({ persistenceFails: true });
  await expect(service.upload(actor, command)).rejects.toThrow("database failed");
  expect(events).toEqual(["normalize", "put", "replace", "delete:tenants/a/products/new.webp"]);
});

test("eleva falha de compensação e sinaliza limpeza posterior do objeto antigo", async () => {
  const failed = createService({ persistenceFails: true, deletionFails: true });
  await expect(failed.service.upload(actor, command)).rejects.toBeInstanceOf(CatalogImageCompensationError);

  const pending = createService({ previousKey: "tenants/a/products/old.webp", deletionFails: true });
  await expect(pending.service.upload(actor, command)).resolves.toMatchObject({
    previousObjectCleanupPending: true,
  });
  expect(pending.events).toContain("delete:tenants/a/products/old.webp");
});
