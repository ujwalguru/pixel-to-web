import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  clampDuration,
  escapeLike,
  normalizeBookingCode,
  QR_TTL_SECONDS,
  type ActiveSession,
  type Result,
} from "./kiosk";

// Kiosk endpoints are intentionally public (the PC screen has no sign-in).
// Every handler validates input and only touches kiosk tables via fixed queries.

const pcIdSchema = z.string().trim().min(1).max(32);

type SessionRow = {
  id: string;
  pc_id: string;
  player_name: string;
  mode: string;
  duration_seconds: number;
  started_at: string;
  ends_at: string;
};

function toDto(row: SessionRow): ActiveSession {
  return {
    id: row.id,
    pcId: row.pc_id,
    playerName: row.player_name,
    mode: row.mode,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    endsAt: row.ends_at,
  };
}

export const getActiveSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ pcId: pcIdSchema }).parse(input))
  .handler(async ({ data }): Promise<ActiveSession | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("pc_sessions")
      .select("id, pc_id, player_name, mode, duration_seconds, started_at, ends_at")
      .eq("pc_id", data.pcId)
      .is("ended_at", null)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("getActiveSession", error);
      return null;
    }
    return row ? toDto(row) : null;
  });

export const startSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        pcId: pcIdSchema,
        mode: z.enum(["member", "upbooking", "username"]),
        value: z.string().trim().min(1).max(64),
        durationSeconds: z.number().int(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<ActiveSession>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();

    const { data: busy } = await supabaseAdmin
      .from("pc_sessions")
      .select("id")
      .eq("pc_id", data.pcId)
      .is("ended_at", null)
      .gt("ends_at", now.toISOString())
      .limit(1)
      .maybeSingle();
    if (busy) return { ok: false, error: "This PC is already in use." };

    let playerName: string;
    let duration = clampDuration(data.durationSeconds);

    if (data.mode === "upbooking") {
      const code = normalizeBookingCode(data.value);
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .update({ used_at: now.toISOString() })
        .eq("code", code)
        .is("used_at", null)
        .select("member_name, duration_seconds")
        .maybeSingle();
      if (!booking) return { ok: false, error: "Booking code is not valid or was already used." };
      playerName = booking.member_name;
      duration = booking.duration_seconds;
    } else {
      const column = data.mode === "member" ? "name" : "username";
      const { data: member } = await supabaseAdmin
        .from("members")
        .select("name")
        .ilike(column, escapeLike(data.value))
        .limit(1)
        .maybeSingle();
      if (!member) {
        return {
          ok: false,
          error: data.mode === "member" ? "Member not found." : "Username not found.",
        };
      }
      playerName = member.name;
    }

    const { data: row, error } = await supabaseAdmin
      .from("pc_sessions")
      .insert({
        pc_id: data.pcId,
        mode: data.mode,
        player_name: playerName,
        duration_seconds: duration,
        started_at: now.toISOString(),
        ends_at: new Date(now.getTime() + duration * 1000).toISOString(),
      })
      .select("id, pc_id, player_name, mode, duration_seconds, started_at, ends_at")
      .single();
    if (error || !row) {
      console.error("startSession", error);
      return { ok: false, error: "Could not start the session. Please try again." };
    }
    return { ok: true, value: toDto(row) };
  });

export const endSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ pcId: pcIdSchema, sessionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pc_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("pc_id", data.pcId)
      .is("ended_at", null);
    if (error) console.error("endSession", error);
    return { ok: !error };
  });

export const createPairing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ pcId: pcIdSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    // Housekeeping: drop this PC's pairings that expired over an hour ago.
    await supabaseAdmin
      .from("qr_pairings")
      .delete()
      .eq("pc_id", data.pcId)
      .lt("expires_at", new Date(now - 3600_000).toISOString());

    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabaseAdmin.from("qr_pairings").insert({
      token,
      pc_id: data.pcId,
      expires_at: new Date(now + QR_TTL_SECONDS * 1000).toISOString(),
    });
    if (error) {
      console.error("createPairing", error);
      return { token: null as string | null };
    }
    return { token: token as string | null };
  });

export const getPairing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("qr_pairings")
      .select("pc_id, expires_at, claimed_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!row) return { status: "invalid" as const, pcId: null };
    if (row.claimed_at) return { status: "used" as const, pcId: row.pc_id };
    if (new Date(row.expires_at).getTime() < Date.now())
      return { status: "expired" as const, pcId: row.pc_id };
    return { status: "ready" as const, pcId: row.pc_id };
  });

export const claimPairing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().regex(/^[a-f0-9]{32}$/),
        username: z.string().trim().min(1).max(64),
        durationSeconds: z.number().int(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<ActiveSession>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();

    const pattern = escapeLike(data.username);
    let { data: member } = await supabaseAdmin
      .from("members")
      .select("name")
      .ilike("username", pattern)
      .limit(1)
      .maybeSingle();
    if (!member) {
      ({ data: member } = await supabaseAdmin
        .from("members")
        .select("name")
        .ilike("name", pattern)
        .limit(1)
        .maybeSingle());
    }
    if (!member) return { ok: false, error: "Member or username not found." };

    const { data: pairing } = await supabaseAdmin
      .from("qr_pairings")
      .select("id, pc_id, expires_at")
      .eq("token", data.token)
      .is("claimed_at", null)
      .maybeSingle();
    if (!pairing || new Date(pairing.expires_at).getTime() < now.getTime()) {
      return { ok: false, error: "This QR code has expired. Scan the new code on the PC." };
    }

    const { data: busy } = await supabaseAdmin
      .from("pc_sessions")
      .select("id")
      .eq("pc_id", pairing.pc_id)
      .is("ended_at", null)
      .gt("ends_at", now.toISOString())
      .limit(1)
      .maybeSingle();
    if (busy) return { ok: false, error: "This PC is already in use." };

    const { data: claimed } = await supabaseAdmin
      .from("qr_pairings")
      .update({ claimed_at: now.toISOString() })
      .eq("id", pairing.id)
      .is("claimed_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return { ok: false, error: "This QR code was already used." };

    const duration = clampDuration(data.durationSeconds);
    const { data: row, error } = await supabaseAdmin
      .from("pc_sessions")
      .insert({
        pc_id: pairing.pc_id,
        mode: "qr",
        player_name: member.name,
        duration_seconds: duration,
        started_at: now.toISOString(),
        ends_at: new Date(now.getTime() + duration * 1000).toISOString(),
      })
      .select("id, pc_id, player_name, mode, duration_seconds, started_at, ends_at")
      .single();
    if (error || !row) {
      console.error("claimPairing", error);
      return { ok: false, error: "Could not start the session. Please try again." };
    }
    return { ok: true, value: toDto(row) };
  });

// ---- Staff PIN (protects the Settings pop-up) ----

const pinSchema = z.string().regex(/^\d{4,8}$/);

async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`airavoto-pin:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const verifyStaffPin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ pin: pinSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("kiosk_staff")
      .select("pin_hash")
      .eq("id", 1)
      .maybeSingle();
    if (!row) return { ok: false };
    // Small delay slows down guessing.
    await new Promise((r) => setTimeout(r, 400));
    return { ok: row.pin_hash === (await hashPin(data.pin)) };
  });

export const changeStaffPin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ currentPin: pinSchema, newPin: pinSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<Result<true>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("kiosk_staff")
      .update({ pin_hash: await hashPin(data.newPin), updated_at: new Date().toISOString() })
      .eq("id", 1)
      .eq("pin_hash", await hashPin(data.currentPin))
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("changeStaffPin", error);
      return { ok: false, error: "Could not change the PIN. Please try again." };
    }
    if (!updated) return { ok: false, error: "Current PIN is wrong." };
    return { ok: true, value: true };
  });
