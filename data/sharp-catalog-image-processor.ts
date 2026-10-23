import { createHash } from "node:crypto";
import sharp from "sharp";
import type { CatalogImageProcessor, PreparedCatalogImage } from "./catalog-image-upload-ports";
import {
  CatalogImageValidationError,
  MAX_LOGO_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_PIXELS,
  validateInspectedSourceImage,
  type CatalogImageSource,
  type CatalogImageTarget,
  type SourceImageMediaType,
} from "../domain/catalog-image-administration";

const ACCEPTED_FORMATS: Readonly<Record<string, SourceImageMediaType | undefined>> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const WEBP_QUALITY_STEPS = [82, 76, 70, 64, 58, 52, 46, 40] as const;

export class SharpCatalogImageProcessor implements CatalogImageProcessor {
  async inspectAndNormalize(
    source: CatalogImageSource,
    target: CatalogImageTarget,
  ): Promise<PreparedCatalogImage> {
    try {
      const input = Buffer.from(source.bytes);
      const metadata = await sharp(input, {
        failOn: "warning",
        limitInputPixels: MAX_SOURCE_IMAGE_PIXELS,
        sequentialRead: true,
      }).metadata();
      const mediaType = metadata.format ? ACCEPTED_FORMATS[metadata.format] : undefined;
      if (!mediaType || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1) {
        throw new CatalogImageValidationError("Arquivo não contém uma imagem estática aceita.");
      }
      const inspection = {
        mediaType,
        byteSize: input.byteLength,
        widthPixels: metadata.width,
        heightPixels: metadata.height,
      };
      validateInspectedSourceImage(inspection, source);

      const specification = target.kind === "tenant_logo"
        ? { width: 512, height: 512, maxBytes: MAX_LOGO_IMAGE_BYTES, preset: "icon" as const }
        : { width: 1200, height: 900, maxBytes: MAX_PRODUCT_IMAGE_BYTES, preset: "photo" as const };

      let output: Buffer | undefined;
      for (const quality of WEBP_QUALITY_STEPS) {
        const candidate = await sharp(input, {
          failOn: "warning",
          limitInputPixels: MAX_SOURCE_IMAGE_PIXELS,
          sequentialRead: true,
        })
          .rotate()
          .resize(specification.width, specification.height, {
            fit: "cover",
            position: target.kind === "tenant_logo" ? "centre" : "attention",
          })
          .webp({
            quality,
            alphaQuality: quality,
            effort: 5,
            preset: specification.preset,
            smartSubsample: true,
          })
          .toBuffer();
        if (candidate.byteLength <= specification.maxBytes) {
          output = candidate;
          break;
        }
      }
      if (!output) {
        throw new CatalogImageValidationError("Imagem normalizada excede o limite do destino.");
      }

      return {
        inspection,
        normalized: {
          bytes: new Uint8Array(output),
          mediaType: "image/webp",
          byteSize: output.byteLength,
          widthPixels: specification.width,
          heightPixels: specification.height,
          contentSha256: createHash("sha256").update(output).digest("hex"),
        },
      };
    } catch (error) {
      if (error instanceof CatalogImageValidationError) throw error;
      throw new CatalogImageValidationError("Não foi possível decodificar e normalizar a imagem.");
    }
  }
}
