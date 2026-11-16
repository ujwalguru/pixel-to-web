import { describe, expect, it } from "vitest";
import { clampDuration, formatDuration, normalizeBookingCode } from "./kiosk";

describe("kiosk rules", () => {
  it("never allows less than 30 minutes", () => {
    expect(clampDuration(0)).toBe(1800);
  });
  it("never allows more than 12 hours", () => {
    expect(clampDuration(20 * 3600)).toBe(43200);
  });
  it("rounds durations to 30-minute steps", () => {
    expect(clampDuration(5000)).toBe(5400);
  });
  it("shows durations as HH:MM:SS", () => {
    expect(formatDuration(3600)).toBe("01:00:00");
  });
  it("accepts booking codes typed in lowercase with spaces", () => {
    expect(normalizeBookingCode(" air-1001 ")).toBe("AIR-1001");
  });
});

import { isValidPin, normalizeTerminalName } from "./kiosk";

describe("staff settings rules", () => {
  it("accepts a 4-digit staff PIN", () => {
    expect(isValidPin("1234")).toBe(true);
  });
  it("rejects a staff PIN shorter than 4 digits", () => {
    expect(isValidPin("123")).toBe(false);
  });
  it("rejects a staff PIN with letters", () => {
    expect(isValidPin("12ab")).toBe(false);
  });
  it("rejects an empty terminal name", () => {
    expect(normalizeTerminalName("   ")).toBeNull();
  });
  it("tidies spaces in a terminal name", () => {
    expect(normalizeTerminalName("  PC   12 ")).toBe("PC 12");
  });
});
