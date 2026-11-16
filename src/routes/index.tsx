import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Clock,
  Gamepad2,
  Grip,
  Loader2,
  Monitor,
  Play,
  ScanLine,
  Settings,
  Square,
  User,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import bg from "@/assets/neon_lattice_background.png.asset.json";
import { AiravotoMark } from "@/components/kiosk/AiravotoMark";
import { KioskStage } from "@/components/kiosk/KioskStage";
import { DurationPicker } from "@/components/kiosk/DurationPicker";
import {
  DEFAULT_DURATION,
  PC_ID,
  QR_REFRESH_MS,
  formatDuration,
  type ActiveSession,
  type Mode,
} from "@/lib/kiosk";
import {
  createPairing,
  endSession,
  getActiveSession,
  startSession,
} from "@/lib/kiosk.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Airavoto Dynamic — Start Playing" },
      {
        name: "description",
        content: "Scan with the Airavoto app or enter your access code to start your gaming session.",
      },
      { property: "og:title", content: "Airavoto Dynamic — Start Playing" },
      {
        property: "og:description",
        content: "Scan with the Airavoto app or enter your access code to start your gaming session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODE_UI: { id: Mode; label: string; icon: typeof User; placeholder: string }[] = [
  { id: "member", label: "Member", icon: User, placeholder: "Enter your name" },
  { id: "upbooking", label: "Upbooking", icon: CalendarDays, placeholder: "Enter booking code" },
  { id: "username", label: "Username", icon: UserRound, placeholder: "Enter your username" },
];

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Index() {
  const now = useNow();
  const getActiveFn = useServerFn(getActiveSession);

  const sessionQuery = useQuery({
    queryKey: ["active-session", PC_ID],
    queryFn: () => getActiveFn({ data: { pcId: PC_ID } }),
    refetchInterval: 3000,
  });

  const session = sessionQuery.data ?? null;
  const expired = session && now && new Date(session.endsAt).getTime() <= now.getTime();
  const active = session && !expired ? session : null;

  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "--:--";

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${bg.url})` }}
    >
      <div className="kiosk-overlay pointer-events-none absolute inset-0" />
      <KioskStage>
        <div className="relative flex h-full flex-col px-20 py-8">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <AiravotoMark className="h-[72px] w-[72px] text-foreground" />
              <div className="leading-none">
                <div className="text-[30px] font-bold tracking-wide text-foreground">AIRAVOTO</div>
                <div className="mt-1 text-[24px] font-light tracking-[0.42em] text-foreground">
                  DYNAMIC
                </div>
              </div>
            </div>
            <div className="glass-pill flex items-center gap-2 rounded-full p-1.5">
              <div className="flex items-center gap-2.5 rounded-full px-4 py-2 text-foreground">
                <Monitor className="h-6 w-6" strokeWidth={1.75} />
                <span className="text-xl font-medium">{PC_ID}</span>
              </div>
              <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5">
                <button
                  type="button"
                  aria-label="Settings"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-5 w-5" />
                </button>
                <span className="text-xl font-medium tabular-nums text-foreground">{time}</span>
              </div>
            </div>
          </header>

          {active && now ? (
            <ActiveSessionView session={active} now={now} />
          ) : (
            <WelcomeView />
          )}
        </div>
      </KioskStage>
    </main>
  );
}

function WelcomeView() {
  return (
    <>
      <section className="mt-14 text-center">
        <h1 className="text-glow text-[52px] font-semibold tracking-tight text-foreground">
          Welcome to Airavoto Dynamic
        </h1>
        <p className="mt-4 text-2xl text-muted-foreground">Choose how to start playing</p>
      </section>
      <section className="mx-auto mt-8 grid w-[1000px] grid-cols-2 gap-7">
        <ScanCard />
        <AccessCodeCard />
      </section>
    </>
  );
}

function ScanCard() {
  const createPairingFn = useServerFn(createPairing);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const pairing = useQuery({
    queryKey: ["pairing", PC_ID],
    queryFn: () => createPairingFn({ data: { pcId: PC_ID } }),
    refetchInterval: QR_REFRESH_MS,
    refetchOnWindowFocus: false,
    staleTime: QR_REFRESH_MS,
  });

  const token = pairing.data?.token;

  return (
    <div className="glass-card flex flex-col items-center rounded-[28px] px-8 pb-8 pt-8 text-center">
      <div className="icon-orb flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground">
        <ScanLine className="h-8 w-8" strokeWidth={2} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-foreground">Scan with the Airavoto app</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Open the Airavoto app and scan the QR code to book
      </p>
      <div className="mt-5 rounded-2xl bg-qr p-4">
        <div className="relative flex h-[216px] w-[216px] items-center justify-center">
          {token && origin ? (
            <>
              <QRCodeSVG
                value={`${origin}/scan/${token}`}
                size={216}
                level="H"
                bgColor="var(--qr)"
                fgColor="var(--qr-ink)"
              />
              <div className="icon-orb absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl ring-4 ring-qr">
                <AiravotoMark className="h-12 w-12 text-qr" />
              </div>
            </>
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-qr-ink" />
          )}
        </div>
      </div>
      <p className="mt-6 text-[15px] text-muted-foreground">Code refreshes automatically</p>
    </div>
  );
}

function AccessCodeCard() {
  const queryClient = useQueryClient();
  const startFn = useServerFn(startSession);
  const [mode, setMode] = useState<Mode>("member");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const ui = MODE_UI.find((m) => m.id === mode)!;
  const InputIcon = ui.icon;

  const mutation = useMutation({
    mutationFn: () =>
      startFn({ data: { pcId: PC_ID, mode, value: value.trim(), durationSeconds: duration } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Welcome ${res.value.playerName}! Enjoy your game.`);
      setValue("");
      queryClient.setQueryData(["active-session", PC_ID], res.value);
    },
    onError: () => toast.error("Could not reach the server. Please try again."),
  });

  const start = useCallback(() => {
    if (mutation.isPending) return;
    if (!value.trim()) {
      toast.error(`Please ${ui.placeholder.toLowerCase()}`);
      return;
    }
    mutation.mutate();
  }, [mutation, value, ui]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  return (
    <div className="glass-card glass-card-bright flex flex-col items-center rounded-[28px] px-8 pb-8 pt-8 text-center">
      <div className="icon-orb flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground">
        <Grip className="h-8 w-8" strokeWidth={2.5} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-foreground">Enter access code</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Use the code from your booking or member panel
      </p>

      <div className="mt-5 grid w-full grid-cols-3 gap-3">
        {MODE_UI.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              data-active={mode === m.id}
              onClick={() => {
                setMode(m.id);
                setValue("");
              }}
              className="seg-tab flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[15px] font-medium text-foreground"
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {m.label}
            </button>
          );
        })}
      </div>

      <label className="glass-field mt-4 flex w-full items-center gap-3 rounded-full px-5 py-3">
        <InputIcon className="h-5 w-5 text-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ui.placeholder}
          aria-label={ui.placeholder}
          maxLength={64}
          className="w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-3 w-full">
        {mode === "upbooking" ? (
          <div className="glass-field flex w-full items-center gap-3 rounded-full px-5 py-3">
            <Clock className="h-5 w-5 text-foreground" />
            <span className="text-[17px] text-foreground">Duration</span>
            <span className="ml-auto text-[17px] text-muted-foreground">Set by your booking</span>
          </div>
        ) : (
          <DurationPicker value={duration} onChange={setDuration} />
        )}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={mutation.isPending}
        className="btn-start mt-8 flex w-56 items-center justify-center gap-2 rounded-full py-3.5 text-lg font-semibold text-primary-foreground"
      >
        {mutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5 fill-current" />
        )}
        Start
      </button>
      <p className="mt-5 text-[15px] text-muted-foreground">or press Enter</p>
    </div>
  );
}

function ActiveSessionView({ session, now }: { session: ActiveSession; now: Date }) {
  const queryClient = useQueryClient();
  const endFn = useServerFn(endSession);
  const remaining = Math.max(0, (new Date(session.endsAt).getTime() - now.getTime()) / 1000);
  const progress = Math.min(1, remaining / session.durationSeconds);
  const endsAt = new Date(session.endsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const end = useMutation({
    mutationFn: () => endFn({ data: { pcId: session.pcId, sessionId: session.id } }),
    onSuccess: () => {
      toast.success("Session ended. Thanks for playing!");
      queryClient.setQueryData(["active-session", PC_ID], null);
      queryClient.invalidateQueries({ queryKey: ["pairing", PC_ID] });
    },
    onError: () => toast.error("Could not end the session. Please try again."),
  });

  return (
    <section className="flex flex-1 flex-col items-center justify-center pb-16">
      <div className="glass-card glass-card-bright flex w-[620px] flex-col items-center rounded-[28px] px-12 py-12 text-center">
        <div className="icon-orb flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground">
          <Gamepad2 className="h-10 w-10" strokeWidth={2} />
        </div>
        <p className="mt-6 text-lg text-muted-foreground">Session active</p>
        <h1 className="text-glow mt-1 text-[44px] font-semibold tracking-tight text-foreground">
          Have fun, {session.playerName}!
        </h1>
        <div className="mt-8 text-[72px] font-semibold leading-none tabular-nums text-foreground">
          {formatDuration(remaining)}
        </div>
        <p className="mt-3 text-[15px] text-muted-foreground">time left · ends at {endsAt}</p>
        <div className="glass-field mt-8 h-3 w-full overflow-hidden rounded-full">
          <div
            className="btn-start h-full rounded-full transition-[width] duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => end.mutate()}
          disabled={end.isPending}
          className="seg-tab mt-10 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-medium text-foreground"
        >
          {end.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Square className="h-4 w-4 fill-current" />
          )}
          End session
        </button>
      </div>
    </section>
  );
}
