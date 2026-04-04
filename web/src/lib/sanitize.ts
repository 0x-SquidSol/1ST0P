/**
 * Strip HTML tags and script content from user-provided text.
 * Defense-in-depth — Next.js JSX auto-escapes, but this prevents
 * stored payloads from being dangerous if rendered elsewhere.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
