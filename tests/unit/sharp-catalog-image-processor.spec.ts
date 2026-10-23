import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { SharpCatalogImageProcessor } from "../../data/sharp-catalog-image-processor";
import { CatalogImageValidationError } from "../../domain/catalog-image-administration";

async function source(format: "jpeg" | "png" | "webp", width = 1600, height = 1200) {
  const image = sharp({
    create: { width, height, channels: 4, background: { r: 42, g: 120, b: 70, alpha: 0.8 } },
  });
  const bytes = format === "jpeg"
    ? await image.jpeg().withExif({ IFD0: { Artist: "remover" } }).toBuffer()
    : format === "png"
      ? await image.png().withXmp("<x:xmpmeta>remover</x:xmpmeta>").toBuffer()
      : await image.webp().toBuffer();
  return { bytes: new Uint8Array(bytes), declaredMediaType: `image/${format}` };
}

test("inspeciona assinatura real e normaliza produto para WebP 1200 × 900", async () => {
  const input = await source("jpeg");
  const result = await new SharpCatalogImageProcessor().inspectAndNormalize(input, {
    kind: "product",
    productId: "12000000-0000-0000-0000-000000000001",
  });
  expect(result.inspection).toMatchObject({ mediaType: "image/jpeg", widthPixels: 1600, heightPixels: 1200 });
  expect(result.normalized).toMatchObject({ mediaType: "image/webp", widthPixels: 1200, heightPixels: 900 });
  expect(result.normalized.byteSize).toBeLessThanOrEqual(350 * 1024);
  expect(result.normalized.contentSha256).toBe(
    createHash("sha256").update(result.normalized.bytes).digest("hex"),
  );
  const metadata = await sharp(result.normalized.bytes).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.exif).toBeUndefined();
  expect(metadata.xmp).toBeUndefined();
});

test("normaliza logo quadrada preservando transparência e removendo metadados", async () => {
  const input = await source("png", 900, 600);
  const result = await new SharpCatalogImageProcessor().inspectAndNormalize(input, { kind: "tenant_logo" });
  expect(result.inspection.mediaType).toBe("image/png");
  expect(result.normalized).toMatchObject({ widthPixels: 512, heightPixels: 512 });
  expect(result.normalized.byteSize).toBeLessThanOrEqual(200 * 1024);
  const metadata = await sharp(result.normalized.bytes).metadata();
  expect(metadata.hasAlpha).toBe(true);
  expect(metadata.exif).toBeUndefined();
  expect(metadata.xmp).toBeUndefined();
});

test("aplica recorte central fixo à logo", async () => {
  const input = await sharp({
    create: { width: 900, height: 600, channels: 3, background: "red" },
  }).composite([{
    input: { create: { width: 600, height: 600, channels: 3, background: "blue" } },
    left: 150,
    top: 0,
  }]).png().toBuffer();
  const sourceImage = { bytes: new Uint8Array(input), declaredMediaType: "image/png" };
  const processor = new SharpCatalogImageProcessor();
  const centered = await processor.inspectAndNormalize(sourceImage, { kind: "tenant_logo" });
  const pixels = await sharp(centered.normalized.bytes).removeAlpha().raw().toBuffer();
  const lastPixel = pixels.length - 3;
  expect(pixels[2]).toBeGreaterThan(pixels[0]);
  expect(pixels[lastPixel + 2]).toBeGreaterThan(pixels[lastPixel]);
});

test("aceita WebP e rejeita conteúdo corrompido, formato não permitido e imagem animada", async () => {
  const webp = await source("webp");
  await expect(new SharpCatalogImageProcessor().inspectAndNormalize(webp, { kind: "tenant_logo" }))
    .resolves.toMatchObject({ inspection: { mediaType: "image/webp" } });

  const processor = new SharpCatalogImageProcessor();
  await expect(processor.inspectAndNormalize(
    { bytes: new Uint8Array([1, 2, 3]), declaredMediaType: "image/png" },
    { kind: "tenant_logo" },
  )).rejects.toBeInstanceOf(CatalogImageValidationError);

  const gif = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "red" },
  }).gif().toBuffer();
  await expect(processor.inspectAndNormalize(
    { bytes: new Uint8Array(gif), declaredMediaType: "image/gif" },
    { kind: "tenant_logo" },
  )).rejects.toBeInstanceOf(CatalogImageValidationError);
});

test("rejeita aresta ou quantidade de pixels acima do contrato", async () => {
  const wide = await source("png", 8193, 1);
  const processor = new SharpCatalogImageProcessor();
  await expect(processor.inspectAndNormalize(wide, { kind: "tenant_logo" }))
    .rejects.toBeInstanceOf(CatalogImageValidationError);
});
