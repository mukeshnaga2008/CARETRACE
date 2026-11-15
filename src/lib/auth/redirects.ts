/**
 * Safe redirect validator to prevent Open Redirect vulnerabilities (OWASP/NIST).
 * Universal helper compatible with Edge Runtime, Node.js, and browser contexts.
 */
export function isSafeRedirect(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();

  // Must begin with a single slash, not double-slash (which is protocol-relative URL)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }

  // Reject URLs containing protocol prefixes or backslashes
  if (
    trimmed.includes(":\\") ||
    trimmed.includes(":/") ||
    trimmed.includes("\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return false;
  }

  return true;
}
