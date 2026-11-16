import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ChevronRight,
  Delete,
  Expand,
  KeyRound,
  Loader2,
  Lock,
  Monitor,
  Power,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { isValidPin, normalizeTerminalName } from "@/lib/kiosk";
import { changeStaffPin, verifyStaffPin } from "@/lib/kiosk.functions";

type View = "pin" | "menu" | "setup" | "confirm-end";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "settings" shows the staff menu after the PIN; "reopen" just unlocks the launcher. */
  purpose: "settings" | "reopen";
  pcId: string;
  hasActiveSession: boolean;
  onSaveName: (name: string) => void;
  onEndLauncher: () => Promise<void>;
  onReopen: () => void;
};

export function SettingsDialog(props: Props) {
  const { open, onOpenChange, purpose } = props;
  const [view, setView] = useState<View>("pin");
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) {
      setView("pin");
      setPin("");
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="kiosk-modal-overlay fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="glass-card glass-card-bright fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] p-7 text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {view === "pin" && (
            <PinView
              title={purpose === "reopen" ? "Open launcher" : "Staff settings"}
              pin={pin}
              setPin={setPin}
              onUnlocked={() => {
                if (purpose === "reopen") {
                  props.onReopen();
                  onOpenChange(false);
                } else setView("menu");
              }}
            />
          )}
          {view === "menu" && <MenuView {...props} go={setView} />}
          {view === "setup" && <SetupView {...props} currentPin={pin} back={() => setView("menu")} />}
          {view === "confirm-end" && (
            <ConfirmEndView {...props} back={() => setView("menu")} />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PinView({
  title,
  pin,
  setPin,
  onUnlocked,
}: {
  title: string;
  pin: string;
  setPin: (p: string) => void;
  onUnlocked: () => void;
}) {
  const verifyFn = useServerFn(verifyStaffPin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isValidPin(pin)) {
      setError("Enter your 4–8 digit staff PIN.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await verifyFn({ data: { pin } });
      if (res.ok) onUnlocked();
      else {
        setError("Wrong PIN. Try again.");
        setPin("");
      }
    } catch {
      setError("Could not check the PIN. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const press = (d: string) => {
    setError(null);
    if (pin.length < 8) setPin(pin + d);
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="icon-orb flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground">
        <Lock className="h-7 w-7" />
      </div>
      <DialogPrimitive.Title className="mt-4 text-2xl font-semibold">{title}</DialogPrimitive.Title>
      <p className="mt-1 text-sm text-muted-foreground">Enter the staff PIN to continue</p>

      <form
        className="mt-5 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Staff PIN"
          value={pin}
          maxLength={8}
          onChange={(e) => {
            setError(null);
            setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
          }}
          className="glass-field w-full rounded-full px-5 py-3 text-center text-2xl tracking-[0.6em] text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="••••"
        />
        <p className="mt-2 h-5 text-sm text-destructive">{error}</p>

        <div className="mt-2 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="seg-tab h-14 rounded-2xl text-xl font-semibold text-foreground"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            aria-label="Delete digit"
            onClick={() => setPin(pin.slice(0, -1))}
            className="seg-tab flex h-14 items-center justify-center rounded-2xl text-foreground"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => press("0")}
            className="seg-tab h-14 rounded-2xl text-xl font-semibold text-foreground"
          >
            0
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-start flex h-14 items-center justify-center rounded-2xl text-base font-semibold text-primary-foreground"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MenuView({ pcId, go }: Props & { go: (v: View) => void }) {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const sync = () => setIsFull(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast.error("Full screen isn't allowed in this window.");
    }
  };

  return (
    <div>
      <DialogPrimitive.Title className="text-2xl font-semibold">Settings</DialogPrimitive.Title>
      <p className="mt-1 text-sm text-muted-foreground">Terminal {pcId}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Row icon={Monitor} label="Terminal setup" hint="PC name and staff PIN" onClick={() => go("setup")} />
        <Row
          icon={Expand}
          label={isFull ? "Exit full screen" : "Full screen"}
          hint="Fill the whole display"
          onClick={() => void toggleFull()}
        />
        <Row
          icon={RotateCw}
          label="Restart launcher"
          hint="Reload this screen"
          onClick={() => window.location.reload()}
        />
        <Row
          icon={Power}
          label="End launcher"
          hint="End the session and close the launcher"
          danger
          onClick={() => go("confirm-end")}
        />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  danger,
  onClick,
}: {
  icon: typeof Monitor;
  label: string;
  hint: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`settings-row flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left ${danger ? "settings-row-danger" : ""}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "btn-danger" : "icon-orb"} text-primary-foreground`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-foreground">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

function BackHeader({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Back"
        onClick={back}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <DialogPrimitive.Title className="text-2xl font-semibold">{title}</DialogPrimitive.Title>
    </div>
  );
}

function SetupView({
  pcId,
  onSaveName,
  currentPin,
  back,
}: Props & { currentPin: string; back: () => void }) {
  const changePinFn = useServerFn(changeStaffPin);
  const [name, setName] = useState(pcId);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  const saveName = () => {
    const clean = normalizeTerminalName(name);
    if (!clean) {
      toast.error("Terminal name must be 1–20 characters.");
      return;
    }
    onSaveName(clean);
    setName(clean);
    toast.success(`This PC is now "${clean}".`);
  };

  const savePin = async () => {
    if (!isValidPin(newPin)) {
      toast.error("New PIN must be 4–8 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("The two PINs don't match.");
      return;
    }
    setPinBusy(true);
    try {
      const res = await changePinFn({ data: { currentPin, newPin } });
      if (res.ok) {
        toast.success("Staff PIN changed.");
        setNewPin("");
        setConfirmPin("");
      } else toast.error(res.error);
    } catch {
      toast.error("Could not change the PIN. Please try again.");
    } finally {
      setPinBusy(false);
    }
  };

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  return (
    <div>
      <BackHeader title="Terminal setup" back={back} />

      <section className="mt-6">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="terminal-name">
          Terminal name
        </label>
        <div className="mt-2 flex gap-3">
          <div className="glass-field flex flex-1 items-center gap-3 rounded-full px-5 py-3">
            <Monitor className="h-5 w-5 text-foreground" />
            <input
              id="terminal-name"
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-full bg-transparent text-base text-foreground outline-none"
            />
          </div>
          <button
            type="button"
            onClick={saveName}
            className="btn-start rounded-full px-6 font-semibold text-primary-foreground"
          >
            Save
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Saved on this computer only.</p>
      </section>

      <section className="mt-7">
        <p className="text-sm font-medium text-muted-foreground">Change staff PIN</p>
        <div className="mt-2 flex flex-col gap-3">
          <div className="glass-field flex items-center gap-3 rounded-full px-5 py-3">
            <KeyRound className="h-5 w-5 text-foreground" />
            <input
              type="password"
              inputMode="numeric"
              aria-label="New PIN"
              placeholder="New PIN (4–8 digits)"
              value={newPin}
              onChange={(e) => setNewPin(digits(e.target.value))}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="glass-field flex items-center gap-3 rounded-full px-5 py-3">
            <KeyRound className="h-5 w-5 text-foreground" />
            <input
              type="password"
              inputMode="numeric"
              aria-label="Confirm new PIN"
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(digits(e.target.value))}
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => void savePin()}
            disabled={pinBusy}
            className="seg-tab flex items-center justify-center gap-2 rounded-full py-3 font-medium text-foreground"
          >
            {pinBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Change PIN
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmEndView({
  hasActiveSession,
  onEndLauncher,
  onOpenChange,
  back,
}: Props & { back: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <BackHeader title="End launcher?" back={back} />
      <p className="mt-5 text-base text-muted-foreground">
        {hasActiveSession
          ? "The current player's session will end now and the launcher will close."
          : "The launcher will close. Players won't be able to start a session until staff opens it again."}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={back}
          className="seg-tab rounded-full py-3 font-medium text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onEndLauncher();
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
          className="btn-danger flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-primary-foreground"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          End launcher
        </button>
      </div>
    </div>
  );
}
