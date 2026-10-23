import "server-only";

import { del, put } from "@vercel/blob";
import { VercelBlobCatalogImageStorage } from "./vercel-blob-catalog-image-storage";

export function createVercelBlobCatalogImageStorage(): VercelBlobCatalogImageStorage {
  return new VercelBlobCatalogImageStorage(put, async (pathname) => del(pathname));
}
