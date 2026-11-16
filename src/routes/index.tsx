import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarDays,
  Clock,
  Grip,
  Minus,
  Monitor,
  Play,
  Plus,
  ScanLine,
  Settings,
  User,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import bg from "@/assets/neon_lattice_background.png.asset.json";
import { AiravotoMark } from "@/components/kiosk/AiravotoMark";

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

const PC_ID = "PC 269";
const STEP = 30 * 60; // 30 minutes
const MIN_DURATION = 30 * 60;
const MAX_DURATION = 12 * 60 * 60;

type Mode = "member" | "upbooking" | "username";

const MODES: { id: Mode; label: string; icon: typeof User; placeholder: string }[] = [
  { id: "member", label: "Member", icon: User, placeholder: "Enter your name" },
  { id: "upbooking", label: "Upbooking", icon: CalendarDays, placeholder: "Enter booking code" },
  { id: "username", label: "Username", icon: UserRound, placeholder: "Enter your username" },
];

function formatDuration(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useRotatingToken(ms = 30000) {
  const [token, setToken] = useState("init");
  useEffect(() => {
    const make = () => setToken(Math.random().toString(36).slice(2, 12));
    make();
    const t = setInterval(make, ms);
    return () => clearInterval(t);
  }, [ms]);
  return token;
}

function Index() {
  const now = useClock();
  const token = useRotatingToken();
  const [mode, setMode] = useState<Mode>("member");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState(60 * 60);

  const active = MODES.find((m) => m.id === mode)!;

  const start = useCallback(() => {
    if (!value.trim()) {
      toast.error(`Please ${active.placeholder.toLowerCase()}`);
      return;
    }
    toast.success(`Session started for ${value.trim()} · ${formatDuration(duration)}`);
  }, [value, duration, active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "--:--";

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${bg.url})` }}
    >
      <div className="kiosk-overlay pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 md:px-20 md:py-8">
        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AiravotoMark className="h-14 w-14 text-foreground md:h-[72px] md:w-[72px]" />
            <div className="leading-none">
              <div className="text-2xl font-bold tracking-wide text-foreground md:text-[30px]">
                AIRAVOTO
              </div>
              <div className="mt-1 text-lg font-light tracking-[0.42em] text-foreground md:text-[24px]">
                DYNAMIC
              </div>
            </div>
          </div>

          <div className="glass-pill flex items-center gap-2 rounded-full p-1.5">
            <div className="flex items-center gap-2.5 rounded-full px-4 py-2 text-foreground">
              <Monitor className="h-6 w-6" strokeWidth={1.75} />
              <span className="text-lg font-medium md:text-xl">{PC_ID}</span>
            </div>
            <div className="glass-pill flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5">
              <button
                type="button"
                aria-label="Settings"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
              >
                <Settings className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium tabular-nums text-foreground md:text-xl">
                {time}
              </span>
            </div>
          </div>
        </header>

        {/* Title */}
        <section className="mt-10 text-center md:mt-14">
          <h1 className="text-glow text-4xl font-semibold tracking-tight text-foreground md:text-[52px]">
            Welcome to Airavoto Dynamic
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-2xl">
            Choose how to start playing
          </p>
        </section>

        {/* Cards */}
        <section className="mx-auto mt-8 grid w-full max-w-[1000px] grid-cols-1 gap-7 md:grid-cols-2">
          {/* Scan card */}
          <div className="glass-card flex flex-col items-center rounded-[28px] px-8 pb-8 pt-8 text-center">
            <div className="icon-orb flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground">
              <ScanLine className="h-8 w-8" strokeWidth={2} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">
              Scan with the Airavoto app
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-[15px]">
              Open the Airavoto app and scan the QR code to book
            </p>
            <div className="mt-5 rounded-2xl bg-qr p-4">
              <div className="relative">
                <QRCodeSVG
                  value={`airavoto://book?pc=${encodeURIComponent(PC_ID)}&t=${token}`}
                  size={216}
                  level="H"
                  bgColor="var(--qr)"
                  fgColor="var(--qr-ink)"
                />
                <div className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl icon-orb ring-4 ring-qr">
                  <AiravotoMark className="h-12 w-12 text-qr" />
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground md:text-[15px]">
              Code refreshes automatically
            </p>
          </div>

          {/* Access code card */}
          <div className="glass-card glass-card-bright flex flex-col items-center rounded-[28px] px-8 pb-8 pt-8 text-center">
            <div className="icon-orb flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground">
              <Grip className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">Enter access code</h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-[15px]">
              Use the code from your booking or member panel
            </p>

            <div className="mt-5 grid w-full grid-cols-3 gap-3">
              {MODES.map((m) => {
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
                    className="seg-tab flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium text-foreground md:text-[15px]"
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <label className="glass-field mt-4 flex w-full items-center gap-3 rounded-full px-5 py-3">
              <User className="h-5 w-5 text-foreground" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={active.placeholder}
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-[17px]"
              />
            </label>

            <div className="mt-3 flex w-full items-center gap-3">
              <div className="glass-field flex flex-1 items-center gap-3 rounded-full px-5 py-3">
                <Clock className="h-5 w-5 text-foreground" />
                <span className="text-base text-foreground md:text-[17px]">Duration</span>
                <span className="ml-auto text-base tabular-nums text-foreground md:text-[17px]">
                  {formatDuration(duration)}
                </span>
              </div>
              <button
                type="button"
                aria-label="Decrease duration"
                disabled={duration <= MIN_DURATION}
                onClick={() => setDuration((d) => Math.max(MIN_DURATION, d - STEP))}
                className="round-btn flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground"
              >
                <Minus className="h-5 w-5" strokeWidth={3} />
              </button>
              <button
                type="button"
                aria-label="Increase duration"
                disabled={duration >= MAX_DURATION}
                onClick={() => setDuration((d) => Math.min(MAX_DURATION, d + STEP))}
                className="round-btn flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground"
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>

            <button
              type="button"
              onClick={start}
              className="btn-start mt-8 flex w-56 items-center justify-center gap-2 rounded-full py-3.5 text-lg font-semibold text-primary-foreground"
            >
              <Play className="h-5 w-5 fill-current" />
              Start
            </button>
            <p className="mt-5 text-sm text-muted-foreground md:text-[15px]">or press Enter</p>
          </div>
        </section>
      </div>
    </main>
  );
}
