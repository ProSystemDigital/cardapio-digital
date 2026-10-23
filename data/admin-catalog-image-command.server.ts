import "server-only";

import { Pool } from "pg";
import { AuthorizedCatalogImageAdministrationService } from "../application/authorized-catalog-image-administration-service";
import { AuthorizationService } from "../application/authorization-service";
import { CatalogImageAdministrationService } from "../application/catalog-image-administration-service";
import { CatalogImageUploadRateLimiter } from "../application/catalog-image-upload-rate-limiter";
import type { TrustedIdentity } from "../domain/authorization";
import type { UploadCatalogImageCommand } from "../domain/catalog-image-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCatalogImageMetadataRepository } from "./postgres-catalog-image-metadata-repository";
import { SharpCatalogImageProcessor } from "./sharp-catalog-image-processor.server";
import { createVercelBlobCatalogImageStorage } from "./vercel-blob-catalog-image-storage.server";

let imageCommandPool: Pool | null = null;
const uploadRateLimiter = new CatalogImageUploadRateLimiter();

function getImageCommandPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!databaseUrl || !blobToken) return null;
  imageCommandPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 8_000,
    statement_timeout: 7_000,
    allowExitOnIdle: true,
  });
  return imageCommandPool;
}

export async function uploadDerivedCatalogImage(input: {
  identity: TrustedIdentity;
  command: UploadCatalogImageCommand;
}) {
  const pool = getImageCommandPool();
  if (!pool) return null;
  uploadRateLimiter.consume(input.identity, input.command.tenantId);
  const service = new AuthorizedCatalogImageAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogImageAdministrationService(
      new SharpCatalogImageProcessor(),
      createVercelBlobCatalogImageStorage(),
      new PostgresCatalogImageMetadataRepository(pool),
    ),
  );
  return service.upload(input.identity, input.command);
}
