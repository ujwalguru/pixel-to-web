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
