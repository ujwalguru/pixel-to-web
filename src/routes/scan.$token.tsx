import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Monitor, Play, TriangleAlert, UserRound } from "lucide-react";
import bg from "@/assets/neon_lattice_background.png.asset.json";
import { AiravotoMark } from "@/components/kiosk/AiravotoMark";
import { DurationPicker } from "@/components/kiosk/DurationPicker";
import { DEFAULT_DURATION, formatDuration, type ActiveSession } from "@/lib/kiosk";
import { claimPairing, getPairing } from "@/lib/kiosk.functions";

export const Route = createFileRoute("/scan/$token")({
  head: () => ({
    meta: [
      { title: "Start your session — Airavoto Dynamic" },
      { name: "description", content: "Confirm your Airavoto Dynamic gaming session from your phone." },
      { property: "og:title", content: "Start your session — Airavoto Dynamic" },
      {
        property: "og:description",
        content: "Confirm your Airavoto Dynamic gaming session from your phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { token } = Route.useParams();
  const getPairingFn = useServerFn(getPairing);
  const claimFn = useServerFn(claimPairing);
  const [username, setUsername] = useState("");
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState<ActiveSession | null>(null);

  const validToken = /^[a-f0-9]{32}$/.test(token);
  const pairing = useQuery({
    queryKey: ["scan-pairing", token],
    queryFn: () => getPairingFn({ data: { token } }),
    enabled: validToken,
  });

  const claim = useMutation({
    mutationFn: () =>
      claimFn({ data: { token, username: username.trim(), durationSeconds: duration } }),
    onSuccess: (res) => {
      if (res.ok) {
        setStarted(res.value);
        setError(null);
      } else setError(res.error);
    },
    onError: () => setError("Could not reach the server. Please try again."),
  });

  const status = !validToken ? "invalid" : pairing.data?.status;

  return (
    <main
      className="min-h-screen bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${bg.url})` }}
    >
      <div className="kiosk-overlay flex min-h-screen flex-col items-center px-5 py-8">
        <div className="flex items-center gap-3">
          <AiravotoMark className="h-11 w-11 text-foreground" />
          <div className="leading-none">
            <div className="text-xl font-bold tracking-wide text-foreground">AIRAVOTO</div>
            <div className="mt-1 text-sm font-light tracking-[0.42em] text-foreground">DYNAMIC</div>
          </div>
        </div>

        <div className="glass-card glass-card-bright mt-10 flex w-full max-w-md flex-col items-center rounded-[28px] px-5 py-8 text-center">
          {pairing.isLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-foreground" />
          ) : started ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary-glow" />
              <h1 className="mt-4 text-2xl font-semibold text-foreground">
                You're in, {started.playerName}!
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your {formatDuration(started.durationSeconds)} session has started on{" "}
                {started.pcId}. Head to your PC and enjoy.
              </p>
            </>
          ) : status !== "ready" ? (
            <>
              <TriangleAlert className="h-14 w-14 text-primary-glow" />
              <h1 className="mt-4 text-2xl font-semibold text-foreground">
                {status === "used" ? "Code already used" : "QR code expired"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Scan the new QR code shown on the PC screen.
              </p>
            </>
          ) : (
            <>
              <div className="glass-pill flex items-center gap-2 rounded-full px-4 py-2 text-foreground">
                <Monitor className="h-5 w-5" />
                <span className="font-medium">{pairing.data?.pcId}</span>
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-foreground">Start your session</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your member name or username
              </p>
              <form
                className="mt-6 flex w-full flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!username.trim()) {
                    setError("Please enter your username.");
                    return;
                  }
                  claim.mutate();
                }}
              >
                <label className="glass-field flex w-full items-center gap-3 rounded-full px-5 py-3">
                  <UserRound className="h-5 w-5 text-foreground" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    aria-label="Username"
                    maxLength={64}
                    autoComplete="username"
                    className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>
                <DurationPicker value={duration} onChange={setDuration} compact />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={claim.isPending}
                  className="btn-start mt-4 flex items-center justify-center gap-2 self-center rounded-full px-12 py-3.5 text-lg font-semibold text-primary-foreground"
                >
                  {claim.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                  Start
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
