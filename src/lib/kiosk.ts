// Browser-safe kiosk rules shared by the screen, the phone page and the server.

export const PC_ID = "PC 269";
export const DURATION_STEP = 30 * 60; // 30 minutes
export const MIN_DURATION = 30 * 60; // 30 minutes
export const MAX_DURATION = 12 * 60 * 60; // 12 hours
export const DEFAULT_DURATION = 60 * 60; // 1 hour
export const QR_REFRESH_MS = 30_000;
export const QR_TTL_SECONDS = 90;

export type Mode = "member" | "upbooking" | "username";
export const MODES: readonly Mode[] = ["member", "upbooking", "username"];

export type ActiveSession = {
  id: string;
  pcId: string;
  playerName: string;
  mode: string;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_DURATION;
  const stepped = Math.round(seconds / DURATION_STEP) * DURATION_STEP;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, stepped));
}

export function formatDuration(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function normalizeBookingCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Escape LIKE wildcards so a typed name matches exactly (case-insensitive). */
export function escapeLike(raw: string): string {
  return raw.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const TERMINAL_STORAGE_KEY = "airavoto.terminal";

/** Staff PIN: 4 to 8 digits. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

/** Terminal name shown on screen, e.g. "PC 269": 1–20 visible characters. */
export function normalizeTerminalName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 20 ? name : null;
}
