import { Clock, Minus, Plus } from "lucide-react";
import { DURATION_STEP, MAX_DURATION, MIN_DURATION, formatDuration } from "@/lib/kiosk";

type Props = { value: number; onChange: (v: number) => void; compact?: boolean };

export function DurationPicker({ value, onChange, compact = false }: Props) {
  return (
    <div className={`flex w-full items-center ${compact ? "gap-2" : "gap-3"}`}>
      <div
        className={`glass-field flex min-w-0 flex-1 items-center gap-3 rounded-full py-3 ${compact ? "px-4" : "px-5"}`}
      >
        <Clock className="h-5 w-5 text-foreground" />
        {!compact && <span className="text-[17px] text-foreground">Duration</span>}
        <span className="ml-auto text-[17px] tabular-nums text-foreground">
          {formatDuration(value)}
        </span>
      </div>
      <button
        type="button"
        aria-label="Decrease duration"
        disabled={value <= MIN_DURATION}
        onClick={() => onChange(Math.max(MIN_DURATION, value - DURATION_STEP))}
        className="round-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-foreground"
      >
        <Minus className="h-5 w-5" strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label="Increase duration"
        disabled={value >= MAX_DURATION}
        onClick={() => onChange(Math.min(MAX_DURATION, value + DURATION_STEP))}
        className="round-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-foreground"
      >
        <Plus className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  );
}
