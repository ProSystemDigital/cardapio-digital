import type { TenantId, TenantRole } from "./catalog";

export const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_EDGE_PIXELS = 8192;
export const MAX_SOURCE_IMAGE_PIXELS = 40_000_000;
export const MAX_LOGO_IMAGE_BYTES = 200 * 1024;
export const MAX_PRODUCT_IMAGE_BYTES = 350 * 1024;
export const MAX_IMAGE_ALT_TEXT_LENGTH = 160;

export type SourceImageMediaType = "image/jpeg" | "image/png" | "image/webp";
export type CatalogImageTarget =
  | Readonly<{ kind: "tenant_logo" }>
  | Readonly<{ kind: "product"; productId: string }>;

export type CatalogImageActor = Readonly<{
  id: string;
  role: TenantRole;
  tenantIds: readonly TenantId[];
}>;

export type CatalogImageSource = Readonly<{
  bytes: Uint8Array;
  declaredMediaType: string;
}>;

export type InspectedSourceImage = Readonly<{
  mediaType: SourceImageMediaType;
  byteSize: number;
  widthPixels: number;
  heightPixels: number;
}>;

export type NormalizedCatalogImage = Readonly<{
  bytes: Uint8Array;
  mediaType: "image/webp";
  byteSize: number;
  widthPixels: number;
  heightPixels: number;
  contentSha256: string;
}>;

export type StoredCatalogImage = Omit<NormalizedCatalogImage, "bytes"> & Readonly<{
  storageProvider: "vercel_blob";
  objectKey: string;
  publicUrl: string;
}>;

export type UploadCatalogImageCommand = Readonly<{
  tenantId: TenantId;
  target: CatalogImageTarget;
  expectedVersion: number | null;
  altText?: string;
  source: CatalogImageSource;
}>;

export class CatalogImageAuthorizationError extends Error {}
export class CatalogImageValidationError extends Error {}
export class CatalogImageConflictError extends Error {}
export class CatalogImageNotFoundError extends Error {}
export class CatalogImageCompensationError extends Error {
  constructor(
    message: string,
    readonly persistenceCause: unknown,
    readonly compensationCause: unknown,
  ) {
    super(message);
  }
}

const ACTOR_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function authorizeCatalogImageMutation(actor: CatalogImageActor, tenantId: TenantId): void {
  if (!ACTOR_UUID_PATTERN.test(actor.id)) {
    throw new CatalogImageAuthorizationError("Ator técnico válido é obrigatório.");
  }
  if (actor.role === "platform_admin") {
    throw new CatalogImageAuthorizationError(
      "Administrador da plataforma não possui edição implícita de imagens.",
    );
  }
  if (!actor.tenantIds.includes(tenantId)) {
    throw new CatalogImageAuthorizationError("Ator não está autorizado para este tenant.");
  }
}

export function validateUploadCatalogImageCommand(command: UploadCatalogImageCommand): void {
  if (!ENTITY_UUID_PATTERN.test(command.tenantId)) {
    throw new CatalogImageValidationError("Tenant inválido.");
  }
  if (command.target.kind === "product" && !ENTITY_UUID_PATTERN.test(command.target.productId)) {
    throw new CatalogImageValidationError("Produto inválido.");
  }
  if (
    command.expectedVersion !== null &&
    (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1)
  ) {
    throw new CatalogImageValidationError("Versão esperada inválida.");
  }
  if (!(command.source.bytes instanceof Uint8Array) || command.source.bytes.byteLength < 1) {
    throw new CatalogImageValidationError("Arquivo de imagem é obrigatório.");
  }
  if (command.source.bytes.byteLength > MAX_SOURCE_IMAGE_BYTES) {
    throw new CatalogImageValidationError("Arquivo de origem excede 5 MB.");
  }
  if (!(["image/jpeg", "image/png", "image/webp"] as readonly string[]).includes(command.source.declaredMediaType)) {
    throw new CatalogImageValidationError("Tipo declarado da imagem não é aceito.");
  }
  validateAltText(command.target, command.altText);
}

export function validateInspectedSourceImage(
  image: InspectedSourceImage,
  source: CatalogImageSource,
): void {
  if (!(["image/jpeg", "image/png", "image/webp"] as readonly string[]).includes(image.mediaType)) {
    throw new CatalogImageValidationError("Conteúdo real da imagem não é aceito.");
  }
  if (!Number.isSafeInteger(image.byteSize) || image.byteSize < 1 || image.byteSize > MAX_SOURCE_IMAGE_BYTES) {
    throw new CatalogImageValidationError("Tamanho real da imagem é inválido.");
  }
  if (image.byteSize !== source.bytes.byteLength || image.mediaType !== source.declaredMediaType) {
    throw new CatalogImageValidationError("Conteúdo real diverge do arquivo declarado.");
  }
  if (
    !Number.isSafeInteger(image.widthPixels) ||
    !Number.isSafeInteger(image.heightPixels) ||
    image.widthPixels < 1 ||
    image.heightPixels < 1 ||
    image.widthPixels > MAX_SOURCE_IMAGE_EDGE_PIXELS ||
    image.heightPixels > MAX_SOURCE_IMAGE_EDGE_PIXELS ||
    image.widthPixels * image.heightPixels > MAX_SOURCE_IMAGE_PIXELS
  ) {
    throw new CatalogImageValidationError("Dimensões reais da imagem são inválidas.");
  }
}

export function validateNormalizedCatalogImage(
  target: CatalogImageTarget,
  image: NormalizedCatalogImage,
): void {
  const expected = target.kind === "tenant_logo"
    ? { width: 512, height: 512, maxBytes: MAX_LOGO_IMAGE_BYTES }
    : { width: 1200, height: 900, maxBytes: MAX_PRODUCT_IMAGE_BYTES };
  if (image.mediaType !== "image/webp") {
    throw new CatalogImageValidationError("Imagem normalizada deve usar WebP.");
  }
  if (image.widthPixels !== expected.width || image.heightPixels !== expected.height) {
    throw new CatalogImageValidationError("Dimensões normalizadas não correspondem ao destino.");
  }
  if (
    !(image.bytes instanceof Uint8Array) ||
    image.bytes.byteLength !== image.byteSize ||
    image.byteSize < 1 ||
    image.byteSize > expected.maxBytes
  ) {
    throw new CatalogImageValidationError("Tamanho normalizado é inválido.");
  }
  if (!SHA256_PATTERN.test(image.contentSha256)) {
    throw new CatalogImageValidationError("Hash da imagem normalizada é inválido.");
  }
}

export function validateStoredCatalogImage(
  target: CatalogImageTarget,
  image: StoredCatalogImage,
  normalized: NormalizedCatalogImage,
): void {
  if (image.storageProvider !== "vercel_blob") {
    throw new CatalogImageValidationError("Provedor de armazenamento inválido.");
  }
  if (!image.objectKey || image.objectKey.length > 512 || image.objectKey.includes("..")) {
    throw new CatalogImageValidationError("Chave do objeto é inválida.");
  }
  let url: URL;
  try {
    url = new URL(image.publicUrl);
  } catch {
    throw new CatalogImageValidationError("URL pública da imagem é inválida.");
  }
  if (url.protocol !== "https:" || image.publicUrl.length > 2048) {
    throw new CatalogImageValidationError("URL pública da imagem deve usar HTTPS.");
  }
  const expected = target.kind === "tenant_logo"
    ? { width: 512, height: 512, maxBytes: MAX_LOGO_IMAGE_BYTES }
    : { width: 1200, height: 900, maxBytes: MAX_PRODUCT_IMAGE_BYTES };
  if (
    image.mediaType !== "image/webp" ||
    image.widthPixels !== expected.width ||
    image.heightPixels !== expected.height ||
    image.byteSize < 1 ||
    image.byteSize > expected.maxBytes ||
    !SHA256_PATTERN.test(image.contentSha256) ||
    image.mediaType !== normalized.mediaType ||
    image.widthPixels !== normalized.widthPixels ||
    image.heightPixels !== normalized.heightPixels ||
    image.byteSize !== normalized.byteSize ||
    image.contentSha256 !== normalized.contentSha256
  ) {
    throw new CatalogImageValidationError("Metadados armazenados divergem da imagem normalizada.");
  }
}

function validateAltText(target: CatalogImageTarget, altText: string | undefined): void {
  if (target.kind === "tenant_logo") {
    if (altText !== undefined) {
      throw new CatalogImageValidationError("Texto alternativo da logo é derivado do perfil.");
    }
    return;
  }
  if (!altText?.trim() || altText.length > MAX_IMAGE_ALT_TEXT_LENGTH) {
    throw new CatalogImageValidationError("Texto alternativo do produto é obrigatório e limitado.");
  }
}
