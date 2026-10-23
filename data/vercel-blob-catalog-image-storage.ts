import { randomUUID } from "node:crypto";
import type { CatalogImageObjectStorage } from "./catalog-image-upload-ports";
import type {
  CatalogImageTarget,
  NormalizedCatalogImage,
  StoredCatalogImage,
} from "../domain/catalog-image-administration";
import type { TenantId } from "../domain/catalog";

// PostgreSQL's uuid type accepts the canonical hexadecimal representation
// independently of RFC version/variant bits. Tenant and catalog fixtures use
// that valid representation for deterministic technical identifiers.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_KEY_PATTERN = /^catalog\/tenants\/[0-9a-f-]{36}\/(?:logo|products\/[0-9a-f-]{36})\/[0-9a-f-]{36}\.webp$/i;
const PUBLIC_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export type VercelBlobPut = (
  pathname: string,
  body: Buffer,
  options: Readonly<{
    access: "public";
    addRandomSuffix: false;
    allowOverwrite: false;
    contentType: "image/webp";
    cacheControlMaxAge: number;
    abortSignal: AbortSignal;
  }>,
) => Promise<Readonly<{ pathname: string; url: string }>>;

export type VercelBlobDelete = (pathname: string) => Promise<void>;

export class VercelBlobCatalogImageStorage implements CatalogImageObjectStorage {
  constructor(
    private readonly putBlob: VercelBlobPut,
    private readonly deleteBlob: VercelBlobDelete,
    private readonly createObjectId: () => string = randomUUID,
    private readonly uploadTimeoutMs = 15_000,
  ) {}

  async put(
    tenantId: TenantId,
    target: CatalogImageTarget,
    image: NormalizedCatalogImage,
  ): Promise<StoredCatalogImage> {
    assertUuid(tenantId, "tenant");
    if (target.kind === "product") assertUuid(target.productId, "produto");
    const objectId = this.createObjectId();
    assertUuid(objectId, "objeto");
    const pathname = target.kind === "tenant_logo"
      ? `catalog/tenants/${tenantId}/logo/${objectId}.webp`
      : `catalog/tenants/${tenantId}/products/${target.productId}/${objectId}.webp`;
    if (!Number.isSafeInteger(this.uploadTimeoutMs) || this.uploadTimeoutMs < 1 || this.uploadTimeoutMs > 30_000) {
      throw new Error("Timeout de upload inválido.");
    }
    const timeout = AbortSignal.timeout(this.uploadTimeoutMs);
    let stored: Readonly<{ pathname: string; url: string }>;
    try {
      stored = await this.putBlob(pathname, Buffer.from(image.bytes), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "image/webp",
        cacheControlMaxAge: 31_536_000,
        abortSignal: timeout,
      });
    } catch (error) {
      if (timeout.aborted) throw new Error("Upload da imagem excedeu o tempo limite.", { cause: error });
      throw error;
    }
    if (stored.pathname !== pathname) {
      throw new Error("Vercel Blob devolveu uma chave diferente da chave solicitada.");
    }
    assertPublicBlobUrl(stored.url, pathname);
    return {
      storageProvider: "vercel_blob",
      objectKey: stored.pathname,
      publicUrl: stored.url,
      mediaType: image.mediaType,
      widthPixels: image.widthPixels,
      heightPixels: image.heightPixels,
      byteSize: image.byteSize,
      contentSha256: image.contentSha256,
    };
  }

  async delete(objectKey: string): Promise<void> {
    if (!OBJECT_KEY_PATTERN.test(objectKey) || objectKey.includes("..")) {
      throw new Error("Chave recusada para exclusão no armazenamento de imagens.");
    }
    await this.deleteBlob(objectKey);
  }
}

function assertUuid(value: string, subject: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error(`Identificador de ${subject} inválido para armazenamento.`);
}

function assertPublicBlobUrl(value: string, pathname: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Vercel Blob devolveu uma URL inválida.");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(PUBLIC_BLOB_HOST_SUFFIX) ||
    decodeURIComponent(url.pathname.slice(1)) !== pathname
  ) {
    throw new Error("Vercel Blob devolveu uma URL pública fora do contrato.");
  }
}
