import type {
  CatalogImageActor,
  CatalogImageTarget,
  CatalogImageSource,
  InspectedSourceImage,
  NormalizedCatalogImage,
  StoredCatalogImage,
  UploadCatalogImageCommand,
} from "../domain/catalog-image-administration";
import type { TenantId } from "../domain/catalog";

export type PreparedCatalogImage = Readonly<{
  inspection: InspectedSourceImage;
  normalized: NormalizedCatalogImage;
}>;

export interface CatalogImageProcessor {
  inspectAndNormalize(source: CatalogImageSource, target: CatalogImageTarget): Promise<PreparedCatalogImage>;
}

export interface CatalogImageObjectStorage {
  put(tenantId: TenantId, target: CatalogImageTarget, image: NormalizedCatalogImage): Promise<StoredCatalogImage>;
  delete(objectKey: string): Promise<void>;
}

export type CatalogImagePersistenceResult = Readonly<{
  tenantId: TenantId;
  version: number;
  previousObjectKey?: string;
}>;

export type PersistCatalogImageCommand = Omit<UploadCatalogImageCommand, "source">;

export interface CatalogImageMetadataRepository {
  replace(
    actor: CatalogImageActor,
    command: PersistCatalogImageCommand,
    image: StoredCatalogImage,
  ): Promise<CatalogImagePersistenceResult>;
}
