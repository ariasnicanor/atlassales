import { useRef, useState } from "react";
import { prefersReducedMotion, useInViewOnce } from "./useReveal";

const formatter = new Intl.NumberFormat("es-AR");

/** Número que cuenta desde 0 cuando entra en pantalla (una sola vez). */
export function CountUp({
  value,
  duration = 1400,
  prefix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useInViewOnce(ref, () => {
    if (started.current || prefersReducedMotion()) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out quart: arranca rápido y frena suave.
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    setShown(0);
    requestAnimationFrame(tick);
  });

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatter.format(shown)}
    </span>
  );
}
