import { useEffect, useState, type ReactNode } from "react";

type Props = { children: ReactNode; width?: number; height?: number };

/**
 * Renders a fixed-size design canvas scaled to fit the window exactly,
 * so the kiosk looks identical on any screen and never scrolls.
 */
export function KioskStage({ children, width = 1600, height = 900 }: Props) {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [width, height]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 transition-opacity duration-300"
        style={{
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          opacity: scale === null ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
