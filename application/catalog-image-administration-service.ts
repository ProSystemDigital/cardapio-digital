import type {
  CatalogImageMetadataRepository,
  CatalogImageObjectStorage,
  CatalogImageProcessor,
} from "../data/catalog-image-upload-ports";
import {
  CatalogImageCompensationError,
  authorizeCatalogImageMutation,
  validateInspectedSourceImage,
  validateNormalizedCatalogImage,
  validateStoredCatalogImage,
  validateUploadCatalogImageCommand,
  type CatalogImageActor,
  type UploadCatalogImageCommand,
} from "../domain/catalog-image-administration";

export type CatalogImageAdministrationResult = Readonly<{
  tenantId: string;
  version: number;
  previousObjectCleanupPending: boolean;
}>;

export class CatalogImageAdministrationService {
  constructor(
    private readonly processor: CatalogImageProcessor,
    private readonly storage: CatalogImageObjectStorage,
    private readonly repository: CatalogImageMetadataRepository,
  ) {}

  async upload(
    actor: CatalogImageActor,
    command: UploadCatalogImageCommand,
  ): Promise<CatalogImageAdministrationResult> {
    authorizeCatalogImageMutation(actor, command.tenantId);
    validateUploadCatalogImageCommand(command);

    const prepared = await this.processor.inspectAndNormalize(command.source, command.target);
    validateInspectedSourceImage(prepared.inspection, command.source);
    validateNormalizedCatalogImage(command.target, prepared.normalized);

    const stored = await this.storage.put(command.tenantId, command.target, prepared.normalized);
    validateStoredCatalogImage(command.target, stored, prepared.normalized);

    let persisted;
    try {
      persisted = await this.repository.replace(
        actor,
        {
          tenantId: command.tenantId,
          target: command.target,
          expectedVersion: command.expectedVersion,
          altText: command.altText,
        },
        stored,
      );
    } catch (persistenceCause) {
      try {
        await this.storage.delete(stored.objectKey);
      } catch (compensationCause) {
        throw new CatalogImageCompensationError(
          "Persistência falhou e o objeto novo exige limpeza operacional.",
          persistenceCause,
          compensationCause,
        );
      }
      throw persistenceCause;
    }

    let previousObjectCleanupPending = false;
    if (persisted.previousObjectKey && persisted.previousObjectKey !== stored.objectKey) {
      try {
        await this.storage.delete(persisted.previousObjectKey);
      } catch {
        previousObjectCleanupPending = true;
      }
    }

    return {
      tenantId: persisted.tenantId,
      version: persisted.version,
      previousObjectCleanupPending,
    };
  }
}
