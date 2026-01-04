/**
 * File Streaming Utilities
 *
 * Provides chunked file upload functionality for large files.
 * Supports progress tracking, pause/resume, and error recovery.
 */

import { logger } from "./logger";

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max
export const MAX_RETRIES = 3;

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  chunkIndex: number;
  totalChunks: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  uploadId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  checksum: string;
}

/**
 * Calculate file checksum (MD5 hash)
 */
export async function calculateChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Split file into chunks
 */
export function* generateFileChunks(file: File, chunkSize: number = CHUNK_SIZE) {
  let offset = 0;
  const totalChunks = Math.ceil(file.size / chunkSize);
  let chunkIndex = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    yield {
      chunk,
      chunkIndex,
      totalChunks,
      offset,
      size: chunk.size,
    };

    offset += chunkSize;
    chunkIndex++;
  }
}

/**
 * Upload a single chunk
 */
async function uploadChunk(
  chunk: Blob,
  metadata: ChunkMetadata,
  endpoint: string,
  headers: Record<string, string> = {}
): Promise<Response> {
  const formData = new FormData();
  formData.append("chunk", chunk);
  formData.append("metadata", JSON.stringify(metadata));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Chunk upload failed: ${response.statusText}`);
  }

  return response;
}

/**
 * Chunked file uploader with progress tracking
 */
export class ChunkedFileUploader {
  private file: File;
  private endpoint: string;
  private headers: Record<string, string>;
  private uploadId: string;
  private checksum: string = "";
  private chunkSize: number;
  private aborted: boolean = false;
  private paused: boolean = false;
  private startTime: number = 0;
  private uploadedBytes: number = 0;

  constructor(
    file: File,
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      chunkSize?: number;
      uploadId?: string;
    } = {}
  ) {
    this.file = file;
    this.endpoint = endpoint;
    this.headers = options.headers || {};
    this.chunkSize = options.chunkSize || CHUNK_SIZE;
    this.uploadId = options.uploadId || this.generateUploadId();
  }

  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Upload file in chunks with progress tracking
   */
  async upload(
    onProgress?: (progress: UploadProgress) => void,
    onChunkComplete?: (chunkIndex: number) => void
  ): Promise<{ uploadId: string; success: boolean }> {
    this.aborted = false;
    this.paused = false;
    this.startTime = Date.now();
    this.uploadedBytes = 0;

    // Validate file size
    if (this.file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${this.file.size} bytes) exceeds maximum (${MAX_FILE_SIZE} bytes)`
      );
    }

    // Calculate checksum
    this.checksum = await calculateChecksum(this.file);

    const totalChunks = Math.ceil(this.file.size / this.chunkSize);
    logger.debug("Starting chunked upload", {
      fileName: this.file.name,
      fileSize: this.file.size,
      totalChunks,
      uploadId: this.uploadId,
      checksum: this.checksum,
    });

    let chunkIndex = 0;

    for (const { chunk, chunkIndex: index, totalChunks: total } of generateFileChunks(
      this.file,
      this.chunkSize
    )) {
      // Check if upload was aborted
      if (this.aborted) {
        throw new Error("Upload aborted");
      }

      // Wait if paused
      while (this.paused) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const metadata: ChunkMetadata = {
        chunkIndex: index,
        totalChunks: total,
        uploadId: this.uploadId,
        fileName: this.file.name,
        fileSize: this.file.size,
        fileType: this.file.type,
        checksum: this.checksum,
      };

      // Upload chunk with retry
      let retries = 0;
      let success = false;

      while (!success && retries < MAX_RETRIES) {
        try {
          await uploadChunk(chunk, metadata, this.endpoint, this.headers);
          success = true;

          this.uploadedBytes += chunk.size;
          chunkIndex++;

          // Call chunk complete callback
          if (onChunkComplete) {
            onChunkComplete(index);
          }

          // Update progress
          if (onProgress) {
            const elapsed = (Date.now() - this.startTime) / 1000; // seconds
            const speed = this.uploadedBytes / elapsed; // bytes per second
            const remaining = this.file.size - this.uploadedBytes;
            const estimatedTimeRemaining = remaining / speed;

            const progress: UploadProgress = {
              bytesUploaded: this.uploadedBytes,
              totalBytes: this.file.size,
              percentage: (this.uploadedBytes / this.file.size) * 100,
              chunkIndex: index,
              totalChunks: total,
              speed,
              estimatedTimeRemaining,
            };

            onProgress(progress);
          }
        } catch (error) {
          retries++;
          logger.warn(`Chunk ${index} upload failed, retry ${retries}/${MAX_RETRIES}`, {
            error: error instanceof Error ? error.message : String(error),
          });

          if (retries >= MAX_RETRIES) {
            throw new Error(
              `Failed to upload chunk ${index} after ${MAX_RETRIES} retries`
            );
          }

          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * 1000)
          );
        }
      }
    }

    logger.debug("Upload completed", {
      uploadId: this.uploadId,
      totalBytes: this.uploadedBytes,
    });

    return {
      uploadId: this.uploadId,
      success: true,
    };
  }

  /**
   * Abort upload
   */
  abort(): void {
    this.aborted = true;
    logger.debug("Upload aborted", { uploadId: this.uploadId });
  }

  /**
   * Pause upload
   */
  pause(): void {
    this.paused = true;
    logger.debug("Upload paused", { uploadId: this.uploadId });
  }

  /**
   * Resume upload
   */
  resume(): void {
    this.paused = false;
    logger.debug("Upload resumed", { uploadId: this.uploadId });
  }

  /**
   * Get upload ID
   */
  getUploadId(): string {
    return this.uploadId;
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Format seconds to human-readable time
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export default ChunkedFileUploader;
