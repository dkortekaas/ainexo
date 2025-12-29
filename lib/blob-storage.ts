/**
 * Vercel Blob Storage Utility
 *
 * Handles file uploads and downloads using Vercel Blob Storage.
 * Falls back to local filesystem in development.
 */

import { put, head, del } from "@vercel/blob";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync, mkdir } from "fs";

// Check if we should use Blob Storage
// Only use if token exists AND we're in production
// Note: We check VERCEL_ENV as well because NODE_ENV might not be set correctly in Vercel
const USE_BLOB_STORAGE =
  !!process.env.AI_READ_WRITE_TOKEN &&
  (process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production");

/**
 * Upload a file to storage
 * @param file - File buffer or File object
 * @param filename - Original filename
 * @param contentType - MIME type
 * @returns URL or file path depending on storage type
 */
export async function uploadFile(
  file: Buffer | File,
  filename: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  if (USE_BLOB_STORAGE) {
    // Use Vercel Blob Storage in production
    try {
      const blob = await put(filename, file, {
        access: "public",
        contentType,
        addRandomSuffix: true, // Prevents filename conflicts
      });

      return {
        url: blob.url,
        path: blob.url, // Use URL as path for blob storage
      };
    } catch (error) {
      // If blob storage fails, log error and fallback to local storage
      console.error("Vercel Blob Storage error:", error);

      // Check if it's a "store does not exist" error
      if (
        error instanceof Error &&
        error.message.includes("store does not exist")
      ) {
        console.error(
          "❌ Vercel Blob Store does not exist. Please:\n" +
            "1. Go to Vercel Dashboard → Storage\n" +
            "2. Create a new Blob store\n" +
            "3. Copy the AI_READ_WRITE_TOKEN\n" +
            "4. Add it to your environment variables\n" +
            "\nFalling back to local /tmp storage..."
        );
      }

      // Fall through to local storage fallback
      console.warn("Falling back to local filesystem storage");
    }
  }

  // Fallback to local filesystem (development or if blob storage fails)
  {
    // Fallback to local filesystem in development
    const filesDir = join(tmpdir(), "ainexo-files");
    if (!existsSync(filesDir)) {
      await new Promise<void>((resolve, reject) => {
        mkdir(filesDir, { recursive: true }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    const timestamp = Date.now();
    const fileExtension = filename.split(".").pop() || "bin";
    const fileName = `${timestamp}-${filename}`;
    const filePath = join(filesDir, fileName);

    const buffer =
      file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    await writeFile(filePath, buffer);

    return {
      url: filePath, // In dev, path is the local file path
      path: filePath,
    };
  }
}

/**
 * Check if a file exists in storage
 * @param pathOrUrl - File path (local) or URL (blob storage)
 * @returns True if file exists
 */
export async function fileExists(pathOrUrl: string): Promise<boolean> {
  if (USE_BLOB_STORAGE) {
    try {
      await head(pathOrUrl);
      return true;
    } catch {
      return false;
    }
  } else {
    return existsSync(pathOrUrl);
  }
}

/**
 * Read a file from storage
 * @param pathOrUrl - File path (local) or URL (blob storage)
 * @returns File buffer
 */
export async function readFileFromStorage(pathOrUrl: string): Promise<Buffer> {
  if (USE_BLOB_STORAGE) {
    // For blob storage, fetch from URL
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from blob storage: ${response.statusText}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    // Read from local filesystem
    return await readFile(pathOrUrl);
  }
}

/**
 * Read a text file from storage
 * @param pathOrUrl - File path (local) or URL (blob storage)
 * @param encoding - Text encoding (default: utf-8)
 * @returns File content as string
 */
export async function readTextFileFromStorage(
  pathOrUrl: string,
  encoding: BufferEncoding = "utf-8"
): Promise<string> {
  if (USE_BLOB_STORAGE) {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from blob storage: ${response.statusText}`
      );
    }
    return await response.text();
  } else {
    return await readFile(pathOrUrl, encoding);
  }
}

/**
 * Delete a file from storage
 * @param pathOrUrl - File path (local) or URL (blob storage)
 */
export async function deleteFile(pathOrUrl: string): Promise<void> {
  if (USE_BLOB_STORAGE) {
    try {
      await del(pathOrUrl);
    } catch (error) {
      console.warn(
        `Failed to delete file from blob storage: ${pathOrUrl}`,
        error
      );
    }
  } else {
    try {
      await unlink(pathOrUrl);
    } catch (error) {
      console.warn(`Failed to delete local file: ${pathOrUrl}`, error);
    }
  }
}

/**
 * Get file URL for download
 * In blob storage, returns the public URL
 * In local development, returns the path (which won't work for downloads, but that's OK for dev)
 */
export function getFileUrl(pathOrUrl: string): string {
  if (USE_BLOB_STORAGE) {
    return pathOrUrl; // Already a URL
  } else {
    return pathOrUrl; // Local path
  }
}
