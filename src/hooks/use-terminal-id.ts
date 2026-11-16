import { useCallback, useEffect, useState } from "react";
import { PC_ID, TERMINAL_STORAGE_KEY } from "@/lib/kiosk";

/** This PC's terminal name, saved on this machine. `null` until read on the client. */
export function useTerminalId() {
  const [pcId, setPcId] = useState<string | null>(null);

  useEffect(() => {
    setPcId(window.localStorage.getItem(TERMINAL_STORAGE_KEY) || PC_ID);
  }, []);

  const save = useCallback((name: string) => {
    window.localStorage.setItem(TERMINAL_STORAGE_KEY, name);
    setPcId(name);
  }, []);

  return [pcId, save] as const;
}
