import { useEffect, useRef, useState } from "react";
import { CheckCheck, Plus } from "lucide-react";
import { AtlasLogo } from "@/components/AtlasLogo";
import { prefersReducedMotion } from "./useReveal";

// Guion del demo del hero: una consulta de WhatsApp se convierte en lead y
// avanza en el pipeline. Cada paso dura lo indicado antes de pasar al siguiente.
const SCRIPT = [
  { ms: 900 }, //  0 · chat vacío
  { ms: 1100 }, // 1 · entra la consulta
  { ms: 1200 }, // 2 · el vendedor escribe
  { ms: 1500 }, // 3 · respuesta del vendedor
  { ms: 1400 }, // 4 · el cliente menciona el usado
  { ms: 650 }, //  5 · "Crear lead" presionado
  { ms: 1700 }, // 6 · la tarjeta cae en "Nuevo"
  { ms: 2800 }, // 7 · pasa a "Cotizado"
  { ms: 450 }, //  8 · fundido antes de reiniciar
] as const;

const FINAL_STEP = 7;
const BASE_COUNTS = { nuevo: 4, seguimiento: 6, cotizado: 2 };

export function ProductTheater() {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [still, setStill] = useState(false);

  // Con movimiento reducido se muestra el estado final, sin loop.
  useEffect(() => {
    if (prefersReducedMotion()) {
      setStill(true);
      setStep(FINAL_STEP);
    }
  }, []);

  // Solo corre mientras está en pantalla.
  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (still || !active) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % SCRIPT.length), SCRIPT[step].ms);
    return () => window.clearTimeout(id);
  }, [step, active, still]);

  const fading = step === SCRIPT.length - 1;
  const on = (from: number) => step >= from;
  // Se queda en "Cotizado" durante el fundido; vuelve a 0 ya invisible.
  const leadCol = step >= 7 ? 2 : 0;
  const counts = {
    nuevo: BASE_COUNTS.nuevo + (step === 6 ? 1 : 0),
    seguimiento: BASE_COUNTS.seguimiento,
    cotizado: BASE_COUNTS.cotizado + (step >= 7 ? 1 : 0),
  };

  return (
    <div
      ref={root}
      className="lp-theater"
      data-step={step}
      data-fading={fading || undefined}
      role="img"
      aria-label="Demo animado: una consulta de WhatsApp por una Toyota Hilux se convierte en lead con un clic y avanza en el pipeline hasta Cotizado."
    >
      <div className="lp-theater__bar">
        <AtlasLogo className="size-4 text-[var(--lp-ink)]" />
        <span className="font-heading text-[13px] font-semibold text-[var(--lp-ink)]">
          WhatsApp
        </span>
        <span className="lp-theater__online">
          <span className="lp-theater__dot" /> En línea
        </span>
      </div>

      {/* ── Conversación ── */}
      <div className="lp-chat" aria-hidden="true">
        <div className="lp-chat__head">
          <span className="lp-chat__avatar">LF</span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--lp-ink)]">
              Lucas Ferreyra
            </p>
            <p className="truncate text-[11px] text-[var(--lp-muted)]">+54 9 11 5832-4410</p>
          </div>
          <span className="lp-chip" data-done={on(5) || undefined}>
            {on(5) ? "Lead creado" : "Sin lead"}
          </span>
        </div>

        <div className="lp-chat__body">
          <p className="lp-bubble lp-bubble--in" data-on={on(1) || undefined}>
            Hola! ¿Sigue disponible la Hilux SRV 2021?
            <time>21:47</time>
          </p>
          <div className="lp-stack">
            <p className="lp-bubble lp-bubble--out lp-typing" data-on={step === 2 || undefined}>
              <span />
              <span />
              <span />
            </p>
            <p className="lp-bubble lp-bubble--out" data-on={on(3) || undefined}>
              ¡Hola Lucas! Sí, la tenemos. ¿Te paso la cotización con financiación?
              <time>
                21:48 <CheckCheck className="inline size-3 text-[oklch(0.62_0.13_235)]" />
              </time>
            </p>
          </div>
          <p className="lp-bubble lp-bubble--in" data-on={on(4) || undefined}>
            Dale. Tengo un Gol 2016 para entregar
            <time>21:49</time>
          </p>
        </div>

        <div className="lp-chat__actions">
          <span className="lp-create" data-pressed={step === 5 || undefined}>
            <Plus className="size-3.5" /> Crear lead desde este chat
          </span>
        </div>
      </div>

      {/* ── Pipeline ── */}
      <div className="lp-pipe" aria-hidden="true">
        <Column title="Nuevo" count={counts.nuevo}>
          <MiniCard name="Marina L." car="Fiat Cronos" />
        </Column>
        <Column title="Seguimiento" count={counts.seguimiento}>
          <MiniCard name="Andrés Q." car="VW Taos" />
          <MiniCard name="Paula B." car="Peugeot 208" />
        </Column>
        <Column title="Cotizado" count={counts.cotizado}>
          <MiniCard name="Hernán D." car="Ford Ranger" />
        </Column>

        <div
          className="lp-lead"
          data-on={step >= 6 || undefined}
          data-col={leadCol}
          style={{ ["--col" as string]: leadCol }}
        >
          <p className="truncate text-[12px] font-semibold text-[var(--lp-ink)]">Lucas Ferreyra</p>
          <p className="truncate text-[11px] text-[var(--lp-muted)]">Hilux SRV 2021 · usado Gol</p>
          <span className="lp-lead__badge" data-on={step >= 7 || undefined}>
            Cotización enviada
          </span>
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="lp-col">
      <p className="lp-col__head">
        {title}
        <span key={count} className="lp-col__count">
          {count}
        </span>
      </p>
      <div className="lp-col__slot" />
      {children}
    </div>
  );
}

function MiniCard({ name, car }: { name: string; car: string }) {
  return (
    <div className="lp-mini">
      <p className="truncate text-[11px] font-semibold text-[var(--lp-ink)]">{name}</p>
      <p className="truncate text-[10px] text-[var(--lp-muted)]">{car}</p>
    </div>
  );
}
