import { put } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";
import { logger } from "@/lib/logger";

interface Session {
  user?: {
    id?: string;
    companyId?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    department?: string | null;
    language?: string | null;
    needsVerification?: boolean;
  };
}

/**
 * Comprimeert een bestand voordat het wordt geüpload
 * @param file Het bestand om te comprimeren
 * @param session De sessie-informatie
 * @returns Een gecomprimeerd bestand
 */
async function compressFile(
  file: File | Blob,
  session?: Session
): Promise<Blob> {
  // Check if we're in a browser environment
  const isBrowser =
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof Image !== "undefined";

  // If we're not in a browser, we can't use canvas compression
  if (!isBrowser) {
    return file;
  }

  // If the file is already a Blob (not a File), return it
  if (file instanceof Blob && !(file instanceof File)) {
    return file;
  }

  try {
    // For images, use canvas compression
    if (file.type.startsWith("image/")) {
      return await compressImage(file as File);
    }

    // For PDFs, use PDF compression
    if (file.type === "application/pdf") {
      return await compressPDF(file as File, session);
    }

    // For other files, leave unchanged if already small
    if (file.size > 1024 * 1024) {
      // Only compress if larger than 1MB
      return await compressDocument(file as File);
    }

    return file;
  } catch (error) {
    // Log compression error but continue with original file
    console.error("Error during file compression:", error);
    logger.error("Failed to compress file", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        fileType: file.type,
        fileSize: file.size,
        userId: session?.user?.id,
      },
    });

    // Return the original file if compression fails
    return file;
  }
}

/**
 * Comprimeert een afbeelding met behulp van canvas
 * @param file De afbeelding om te comprimeren
 * @returns Een gecomprimeerde afbeelding als Blob
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Kon canvas context niet maken"));
        return;
      }

      // Bereken nieuwe afmetingen (max 1200px breed of hoog)
      let width = img.width;
      let height = img.height;

      if (width > 1200) {
        height = Math.round((height * 1200) / width);
        width = 1200;
      } else if (height > 1200) {
        width = Math.round((width * 1200) / height);
        height = 1200;
      }

      canvas.width = width;
      canvas.height = height;

      // Teken de afbeelding op het canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Converteer naar blob met compressie
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Kon afbeelding niet comprimeren"));
          }
        },
        file.type,
        0.7 // Kwaliteit (0.7 = 70% kwaliteit)
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Kon afbeelding niet laden"));
    };
  });
}

/**
 * Comprimeert een PDF bestand
 * @param file Het PDF bestand om te comprimeren
 * @param session De sessie-informatie
 * @returns Een gecomprimeerd PDF bestand als Blob
 */
async function compressPDF(file: File, session?: Session): Promise<Blob> {
  try {
    // Lees het PDF bestand
    const arrayBuffer = await file.arrayBuffer();

    // Laad het PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Comprimeer het PDF document met minimale opties
    const compressedPdfBytes = await pdfDoc.save();

    // Converteer de gecomprimeerde bytes naar een Blob
    return new Blob([new Uint8Array(compressedPdfBytes)], {
      type: "application/pdf",
    });
  } catch (error) {
    logger.error("Error compressing PDF", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      userId: session?.user?.id,
      companyId: session?.user?.companyId,
    });
    throw error;
  }
}

/**
 * Comprimeert een document (niet-PDF)
 * @param file Het document om te comprimeren
 * @returns Een gecomprimeerd document als Blob
 */
async function compressDocument(file: File): Promise<Blob> {
  // Voor niet-PDF documenten, gebruik een eenvoudige compressie
  // Dit is een eenvoudige implementatie - voor betere compressie zou je
  // een specifieke bibliotheek kunnen gebruiken

  // Voor nu, retourneer het originele bestand
  return file;
}

// Improved file name handling in uploadFileToVercel
export async function uploadFileToVercel(
  file: File | Blob,
  declarationId: string,
  session?: Session
): Promise<string> {
  try {
    // Create a more structured filename with better organization
    let fileName: string;

    if (file instanceof File && file.name) {
      // Extract the file extension from the original name
      const extension = file.name.split(".").pop() || "";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const userId = session?.user?.id || "unknown";
      const companyId = session?.user?.companyId || "unknown";

      fileName = `declarations/${companyId}/${userId}/${timestamp}.${extension}`;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      fileName = `declarations/unknown/${timestamp}`;
    }

    // Compress the file if needed
    const compressedFile = await compressFile(file, session);

    // Upload to Vercel Blob
    const { url } = await put(fileName, compressedFile, {
      access: "public",
      addRandomSuffix: true,
    });

    return url;
  } catch (error) {
    logger.error("Failed to upload file to Vercel", {
      context: {
        error: error instanceof Error ? error.message : String(error),
        fileType: file.type,
        fileSize: file.size,
        userId: session?.user?.id,
        companyId: session?.user?.companyId,
      },
    });
    throw error;
  }
}
