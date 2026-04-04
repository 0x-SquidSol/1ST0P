/**
 * Client-side localStorage cache for wallet → username mapping.
 * This is the reliable source of truth until a real database exists,
 * since Vercel /tmp gets wiped on cold starts.
 */

const STORAGE_KEY = "1st0p:usernames";

type UsernameMap = Record<string, string>;

function readMap(): UsernameMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UsernameMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: UsernameMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full or unavailable
  }
}

/** Get cached username for a wallet. */
export function getCachedUsername(wallet: string): string | null {
  return readMap()[wallet] ?? null;
}

/** Save a wallet → username mapping. */
export function setCachedUsername(wallet: string, username: string) {
  const map = readMap();
  map[wallet] = username;
  writeMap(map);
}

/** Check if any username is cached for a wallet. */
export function hasUsername(wallet: string): boolean {
  return !!readMap()[wallet];
}
