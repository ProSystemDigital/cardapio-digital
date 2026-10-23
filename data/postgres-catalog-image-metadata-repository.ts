import type { Pool, PoolClient } from "pg";
import type {
  CatalogImageMetadataRepository,
  CatalogImagePersistenceResult,
  PersistCatalogImageCommand,
} from "./catalog-image-upload-ports";
import {
  CatalogImageConflictError,
  CatalogImageNotFoundError,
  type CatalogImageActor,
  type StoredCatalogImage,
} from "../domain/catalog-image-administration";

type CurrentImage = { object_key: string; version: string };

export class PostgresCatalogImageMetadataRepository implements CatalogImageMetadataRepository {
  constructor(private readonly pool: Pool) {}

  async replace(
    actor: CatalogImageActor,
    command: PersistCatalogImageCommand,
    image: StoredCatalogImage,
  ): Promise<CatalogImagePersistenceResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const result = command.target.kind === "tenant_logo"
        ? await this.replaceTenantLogo(client, actor, command, image)
        : await this.replaceProductImage(client, actor, command, command.target.productId, image);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async replaceTenantLogo(
    client: PoolClient,
    actor: CatalogImageActor,
    command: PersistCatalogImageCommand,
    image: StoredCatalogImage,
  ): Promise<CatalogImagePersistenceResult> {
    const tenant = await client.query<{ id: string }>(
      "SELECT id FROM tenants WHERE id = $1 AND archived_at IS NULL",
      [command.tenantId],
    );
    if (!tenant.rows[0]) throw new CatalogImageNotFoundError("Tenant não encontrado.");

    const current = await this.lockCurrentImage(
      client,
      "SELECT object_key, version FROM tenant_profile_images WHERE tenant_id = $1 FOR UPDATE",
      [command.tenantId],
    );
    this.assertExpectedVersion(current, command.expectedVersion);

    const saved = current
      ? await client.query<{ version: string }>(
          `UPDATE tenant_profile_images
              SET storage_provider = $2, object_key = $3, public_url = $4,
                  media_type = $5, width_pixels = $6, height_pixels = $7,
                  byte_size = $8, content_sha256 = $9,
                  version = version + 1, updated_at = now()
            WHERE tenant_id = $1
            RETURNING version`,
          this.imageParameters(command.tenantId, image),
        )
      : await client.query<{ version: string }>(
          `INSERT INTO tenant_profile_images
            (tenant_id, storage_provider, object_key, public_url, media_type,
             width_pixels, height_pixels, byte_size, content_sha256)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING version`,
          this.imageParameters(command.tenantId, image),
        );

    await client.query(
      `INSERT INTO tenant_profile_audit_events
        (tenant_id, actor_id, actor_role, action, changes)
       VALUES ($1, $2, $3, 'tenant.logo.updated', $4::jsonb)`,
      [command.tenantId, actor.id, actor.role, JSON.stringify(this.auditChanges(image))],
    );
    return {
      tenantId: command.tenantId,
      version: Number(saved.rows[0].version),
      ...(current ? { previousObjectKey: current.object_key } : {}),
    };
  }

  private async replaceProductImage(
    client: PoolClient,
    actor: CatalogImageActor,
    command: PersistCatalogImageCommand,
    productId: string,
    image: StoredCatalogImage,
  ): Promise<CatalogImagePersistenceResult> {
    const product = await client.query<{ id: string }>(
      `SELECT id FROM products
        WHERE tenant_id = $1 AND id = $2 AND archived_at IS NULL`,
      [command.tenantId, productId],
    );
    if (!product.rows[0]) throw new CatalogImageNotFoundError("Produto não encontrado.");

    const current = await this.lockCurrentImage(
      client,
      `SELECT object_key, version FROM product_catalog_images
        WHERE tenant_id = $1 AND product_id = $2 FOR UPDATE`,
      [command.tenantId, productId],
    );
    this.assertExpectedVersion(current, command.expectedVersion);
    const parameters = [
      command.tenantId,
      productId,
      image.storageProvider,
      image.objectKey,
      image.publicUrl,
      image.mediaType,
      image.widthPixels,
      image.heightPixels,
      image.byteSize,
      image.contentSha256,
      command.altText,
    ];
    const saved = current
      ? await client.query<{ version: string }>(
          `UPDATE product_catalog_images
              SET storage_provider = $3, object_key = $4, public_url = $5,
                  media_type = $6, width_pixels = $7, height_pixels = $8,
                  byte_size = $9, content_sha256 = $10, alt_text = $11,
                  version = version + 1, updated_at = now()
            WHERE tenant_id = $1 AND product_id = $2
            RETURNING version`,
          parameters,
        )
      : await client.query<{ version: string }>(
          `INSERT INTO product_catalog_images
            (tenant_id, product_id, storage_provider, object_key, public_url, media_type,
             width_pixels, height_pixels, byte_size, content_sha256, alt_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING version`,
          parameters,
        );

    await client.query(
      `INSERT INTO catalog_audit_events
        (tenant_id, actor_id, actor_role, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, 'product.image.updated', 'product', $4, $5::jsonb)`,
      [
        command.tenantId,
        actor.id,
        actor.role,
        productId,
        JSON.stringify({ ...this.auditChanges(image), altText: command.altText }),
      ],
    );
    return {
      tenantId: command.tenantId,
      version: Number(saved.rows[0].version),
      ...(current ? { previousObjectKey: current.object_key } : {}),
    };
  }

  private async lockCurrentImage(
    client: PoolClient,
    sql: string,
    parameters: string[],
  ): Promise<CurrentImage | undefined> {
    const result = await client.query<CurrentImage>(sql, parameters);
    return result.rows[0];
  }

  private assertExpectedVersion(current: CurrentImage | undefined, expected: number | null): void {
    if (!current && expected !== null) {
      throw new CatalogImageNotFoundError("Imagem não encontrada.");
    }
    if ((current && expected === null) || (current && Number(current.version) !== expected)) {
      throw new CatalogImageConflictError("Imagem foi alterada por outra operação.");
    }
  }

  private imageParameters(tenantId: string, image: StoredCatalogImage): Array<string | number> {
    return [
      tenantId,
      image.storageProvider,
      image.objectKey,
      image.publicUrl,
      image.mediaType,
      image.widthPixels,
      image.heightPixels,
      image.byteSize,
      image.contentSha256,
    ];
  }

  private auditChanges(image: StoredCatalogImage): Record<string, string | number> {
    return {
      mediaType: image.mediaType,
      widthPixels: image.widthPixels,
      heightPixels: image.heightPixels,
      byteSize: image.byteSize,
    };
  }
}
