/**
 * CARETRACE Secure File Upload & Storage Path Validation
 * PromptWars × Catalyst 2026: Phase 14 Hardening
 *
 * Enforces strict MIME whitelist, file size boundaries, path traversal prevention,
 * and isolated patient storage scoping for attachments and clinical records.
 */

import { randomUUID } from "crypto";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const EXTENSION_MAP: Record<AllowedMimeType, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFileName?: string;
  detectedExt?: string;
}

/**
 * Strips dangerous path traversal patterns, directory separators, null bytes,
 * and special characters from user-supplied file names.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "unnamed_document";

  // 1. Remove null bytes and control chars
  let clean = fileName.replace(/[\x00-\x1f\x80-\x9f]/g, "");

  // 2. Extract basename (strip leading directories or backslashes)
  clean = clean.split(/[/\\]/).pop() || "unnamed_document";

  // 3. Strip directory traversal sequences (..)
  clean = clean.replace(/\.{2,}/g, ".");

  // 4. Sanitize to safe alphanumeric characters, dashes, underscores, and dots
  clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, "_");

  // 5. Ensure non-empty and max length
  if (clean.length === 0 || clean === ".") {
    clean = "unnamed_document";
  }
  return clean.slice(0, 100);
}

/**
 * Validates a file's metadata against security constraints.
 */
export function validateUploadedFile(
  fileName: string,
  mimeType: string,
  fileSizeBytes: number
): FileValidationResult {
  // 1. Check file size
  if (fileSizeBytes <= 0) {
    return { isValid: false, error: "File cannot be empty (0 bytes)." };
  }
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size (${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 10MB.`,
    };
  }

  // 2. Check MIME type against whitelist
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      isValid: false,
      error: `Disallowed file type: ${mimeType}. Allowed formats: PDF, PNG, JPEG, WebP.`,
    };
  }

  // 3. Check extension compatibility
  const lowerName = fileName.toLowerCase();
  const validExtensions = EXTENSION_MAP[mimeType as AllowedMimeType];
  const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return {
      isValid: false,
      error: `File extension does not match MIME type ${mimeType}. Expected: ${validExtensions.join(", ")}`,
    };
  }

  // 4. Check for path traversal in original file name
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\") || fileName.includes("\0")) {
    return {
      isValid: false,
      error: "Malicious path traversal sequence detected in file name.",
    };
  }

  const sanitized = sanitizeFileName(fileName);
  const detectedExt = validExtensions[0];

  return {
    isValid: true,
    sanitizedFileName: sanitized,
    detectedExt,
  };
}

/**
 * Generates an isolated, unguessable storage path scoped by patient ID.
 * Storage structure: patients/{patientId}/{category}/{uuid}{ext}
 */
export function generateSecureStoragePath(
  patientId: string,
  category: "instructions" | "passport_exports" | "care_records",
  extension: string
): string {
  // Sanitize patient ID to ensure no directory escape
  const cleanPatientId = patientId.replace(/[^a-zA-Z0-9\-_]/g, "");
  const fileId = randomUUID();
  const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;

  return `patients/${cleanPatientId}/${category}/${fileId}${cleanExt}`;
}
