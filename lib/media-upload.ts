/**
 * Media Upload and Management
 * Handles file uploads, image processing, and media library management
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "./db";

export interface CmsMedia {
  id: string;
  filename: string;
  storedName: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Configure upload directory
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const PUBLIC_URL_BASE = process.env.NEXT_PUBLIC_UPLOAD_URL || "/uploads";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Other
  "text/plain",
  "text/csv",
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Initialize upload directory
 */
export async function ensureUploadDir(folder?: string): Promise<string> {
  const dir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Validate file upload
 */
export function validateFile(
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `File type ${mimeType} not allowed` };
  }

  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${size} exceeds maximum of ${MAX_FILE_SIZE} bytes`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
export function generateStoredFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const hash = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Get image dimensions (if image file)
 */
export async function getImageDimensions(
  filePath: string,
  mimeType: string
): Promise<{ width?: number; height?: number }> {
  if (!mimeType.startsWith("image/")) {
    return {};
  }

  try {
    // Use sharp for image processing if available
    // For now, return empty - can be enhanced with sharp library
    return {};
  } catch (error) {
    console.error("Failed to get image dimensions:", error);
    return {};
  }
}

/**
 * Upload file and create media record
 */
export async function uploadMedia(
  fileBuffer: Buffer,
  {
    filename,
    mimeType,
    size,
    alt,
    caption,
    folder,
    uploadedById,
  }: {
    filename: string;
    mimeType: string;
    size: number;
    alt?: string;
    caption?: string;
    folder?: string;
    uploadedById: string;
  }
): Promise<CmsMedia> {
  // Validate file
  const validation = validateFile(mimeType, size);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Ensure upload directory exists
  const uploadDir = await ensureUploadDir(folder);

  // Generate stored filename
  const storedName = generateStoredFilename(filename);
  const filePath = path.join(uploadDir, storedName);

  // Save file to disk
  await fs.writeFile(filePath, fileBuffer);

  // Get image dimensions if image
  const dimensions = await getImageDimensions(filePath, mimeType);

  // Generate public URL
  const url = folder
    ? `${PUBLIC_URL_BASE}/${folder}/${storedName}`
    : `${PUBLIC_URL_BASE}/${storedName}`;

  // Create media record in database using raw SQL (until Prisma client is regenerated)
  const result = await db.$queryRaw<CmsMedia[]>`
    INSERT INTO "cms_media" (
      id, filename, "storedName", url, "mimeType", size, width, height,
      alt, caption, folder, "uploadedById", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      ${filename},
      ${storedName},
      ${url},
      ${mimeType},
      ${size},
      ${dimensions.width || null},
      ${dimensions.height || null},
      ${alt || null},
      ${caption || null},
      ${folder || null},
      ${uploadedById},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const media = result[0];
  console.log(`📁 Uploaded media: ${filename} (${media.id})`);

  return media;
}

/**
 * Get media by ID
 */
export async function getMediaById(id: string): Promise<CmsMedia | null> {
  const result = await db.$queryRaw<CmsMedia[]>`
    SELECT * FROM "cms_media" WHERE id = ${id}
  `;

  return result[0] || null;
}

/**
 * List media with filters
 */
export async function listMedia({
  folder,
  mimeType,
  uploadedById,
  limit = 50,
  offset = 0,
}: {
  folder?: string;
  mimeType?: string;
  uploadedById?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ items: CmsMedia[]; total: number }> {
  // Build WHERE conditions
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (folder !== undefined) {
    conditions.push(`folder = $${params.length + 1}`);
    params.push(folder);
  }

  if (mimeType) {
    conditions.push(`"mimeType" LIKE $${params.length + 1}`);
    params.push(`${mimeType}%`);
  }

  if (uploadedById) {
    conditions.push(`"uploadedById" = $${params.length + 1}`);
    params.push(uploadedById);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get total count
  const countResult = await db.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*)::bigint as count FROM "cms_media" ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0].count);

  // Get paginated results
  const items = await db.$queryRawUnsafe<CmsMedia[]>(
    `SELECT * FROM "cms_media" ${whereClause} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    ...params,
    limit,
    offset
  );

  return { items, total };
}

/**
 * Update media metadata
 */
export async function updateMedia(
  id: string,
  {
    alt,
    caption,
    folder,
  }: {
    alt?: string;
    caption?: string;
    folder?: string;
  }
): Promise<CmsMedia> {
  const result = await db.$queryRaw<CmsMedia[]>`
    UPDATE "cms_media"
    SET
      alt = COALESCE(${alt}, alt),
      caption = COALESCE(${caption}, caption),
      folder = COALESCE(${folder}, folder),
      "updatedAt" = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!result[0]) {
    throw new Error(`Media not found: ${id}`);
  }

  console.log(`✏️ Updated media: ${id}`);
  return result[0];
}

/**
 * Delete media
 */
export async function deleteMedia(id: string): Promise<void> {
  // Get media record
  const media = await getMediaById(id);
  if (!media) {
    throw new Error(`Media not found: ${id}`);
  }

  // Delete file from disk
  try {
    const filePath = path.join(
      UPLOAD_DIR,
      media.folder || "",
      media.storedName
    );
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete file for media ${id}:`, error);
  }

  // Delete database record
  await db.$executeRaw`
    DELETE FROM "cms_media" WHERE id = ${id}
  `;

  console.log(`🗑️ Deleted media: ${id}`);
}

/**
 * Get media usage (where media is referenced)
 */
export async function getMediaUsage(id: string): Promise<{
  pages: number;
  blogPosts: number;
}> {
  const media = await getMediaById(id);
  if (!media) {
    return { pages: 0, blogPosts: 0 };
  }

  // Count pages using this media (in featuredImage or content)
  const pageCount = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint as count FROM "cms_pages"
    WHERE "featuredImage" = ${media.url}
       OR content::text LIKE ${`%${media.url}%`}
  `;

  // Count blog posts using this media
  const blogCount = await db.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::bigint as count FROM "cms_blog_posts"
    WHERE "featuredImage" = ${media.url}
       OR content::text LIKE ${`%${media.url}%`}
  `;

  return {
    pages: Number(pageCount[0].count),
    blogPosts: Number(blogCount[0].count),
  };
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  byMimeType: Record<string, { count: number; size: number }>;
}> {
  const result = await db.$queryRaw<
    Array<{
      mime_type: string;
      count: bigint;
      total_size: bigint;
    }>
  >`
    SELECT
      "mimeType" as mime_type,
      COUNT(*)::bigint as count,
      SUM(size)::bigint as total_size
    FROM "cms_media"
    GROUP BY "mimeType"
  `;

  const byMimeType: Record<string, { count: number; size: number }> = {};
  let totalFiles = 0;
  let totalSize = 0;

  result.forEach((row) => {
    const count = Number(row.count);
    const size = Number(row.total_size);

    byMimeType[row.mime_type] = { count, size };
    totalFiles += count;
    totalSize += size;
  });

  return { totalFiles, totalSize, byMimeType };
}
