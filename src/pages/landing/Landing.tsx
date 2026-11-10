import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  FileSpreadsheet,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { AtlasLogo } from "@/components/AtlasLogo";
import { CountUp } from "./CountUp";
import { ProductTheater } from "./ProductTheater";
import { useRevealOnScroll } from "./useReveal";
import { DEMO_URL, buildWhatsAppLink } from "./config";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useRevealOnScroll(root);

  return (
    <div ref={root} className="lp">
      <Header />
      <main>
        <Hero />
        <Replaces />
        <Problem />
        <HowItWorks />
        <WhatsAppSection />
        <Product />
        <Roles />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="lp-header" data-scrolled={scrolled || undefined}>
      <div className="lp-wrap flex h-16 items-center gap-8">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-[var(--lp-ink)]"
          aria-label="Atlas Sales OS, inicio"
        >
          <AtlasLogo className="size-7" />
          <span className="font-heading text-[15px] font-bold tracking-tight">
            Atlas <span className="font-medium text-[var(--lp-muted)]">Sales OS</span>
          </span>
        </a>
        <nav
          className="hidden items-center gap-7 text-sm font-medium text-[var(--lp-muted)] md:flex"
          aria-label="Secciones"
        >
          <a className="lp-navlink" href="#como-funciona">
            Cómo funciona
          </a>
          <a className="lp-navlink" href="#whatsapp">
            WhatsApp
          </a>
          <a className="lp-navlink" href="#planes">
            Planes
          </a>
          <a className="lp-navlink" href="#preguntas">
            Preguntas
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <a
            href={DEMO_URL}
            className="lp-navlink hidden text-sm font-semibold text-[var(--lp-ink)] sm:inline"
          >
            Ingresar
          </a>
          <a href="#demo" className="lp-btn lp-btn--sm">
            Pedir demo
          </a>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────── Hero ──────────────────────────── */

function Hero() {
  return (
    <section id="top" className="lp-hero">
      <svg
        className="lp-hero__slopes"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path pathLength={1} d="M640 -40 L1240 860" />
        <path pathLength={1} d="M640 -40 L40 860" />
      </svg>
      <div className="lp-wrap grid items-center gap-14 pb-20 pt-10 lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <div>
          <p className="lp-in lp-eyebrow" style={{ "--i": 0 } as CSSProperties}>
            CRM para concesionarias y agencias de autos
          </p>
          <h1 className="lp-h1 mt-6">
            <span className="lp-line">
              <span style={{ "--i": 1 } as CSSProperties}>Menos tiempo cargando.</span>
            </span>
            <span className="lp-line">
              <span style={{ "--i": 2 } as CSSProperties}>
                Más tiempo{" "}
                <span className="lp-underline">
                  vendiendo.
                  <svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                    <path pathLength={1} d="M3 13 C 70 4, 160 3, 297 9" />
                  </svg>
                </span>
              </span>
            </span>
          </h1>
          <p
            className="lp-in lp-lead-text mt-7 max-w-[34rem]"
            style={{ "--i": 3 } as CSSProperties}
          >
            Atlas junta el WhatsApp de la agencia, los leads, el stock y las cotizaciones en un solo
            lugar. Cada consulta tiene vendedor, seguimiento con fecha y un cierre.
          </p>
          <div
            className="lp-in mt-9 flex flex-wrap items-center gap-x-5 gap-y-3"
            style={{ "--i": 4 } as CSSProperties}
          >
            <a href="#demo" className="lp-btn">
              Pedir una demo <ArrowRight className="lp-btn__arrow size-4" />
            </a>
            <p className="text-sm text-[var(--lp-muted)]">Con tu stock y tu forma de trabajar.</p>
          </div>
        </div>
        <div className="lp-in lp-in--stage" style={{ "--i": 2 } as CSSProperties}>
          <ProductTheater />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Lo que deja de existir ───────────────────── */

const REPLACED = [
  "la planilla compartida que nadie actualiza",
  "el cuaderno del salón",
  "las consultas en el celular de cada vendedor",
  "el “después te llamo” que nunca llega",
];

function Replaces() {
  return (
    <section className="border-y border-[var(--lp-line)] bg-[var(--lp-paper-2)]">
      <div className="lp-wrap flex flex-col gap-4 py-8 lg:flex-row lg:items-baseline lg:gap-10">
        <p className="shrink-0 font-heading text-sm font-semibold text-[var(--lp-ink)]">
          En tu agencia deja de existir:
        </p>
        <ul className="lp-strikes flex flex-wrap gap-x-8 gap-y-2" data-reveal>
          {REPLACED.map((item, i) => (
            <li key={item} style={d(250 + i * 180)}>
              <span className="lp-strike">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────── Problema ─────────────────────────── */

const TIMELINE = [
  { when: "Viernes 22:41", what: "Entra una consulta por la Amarok V6 que publicaste." },
  { when: "Sábado 10:15", what: "El vendedor está de franco. Nadie más ve ese chat." },
  { when: "Lunes 09:30", what: "Le responden. Ya había señado en otra agencia." },
];

function Problem() {
  return (
    <section className="lp-section">
      <div className="lp-wrap grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <h2 className="lp-h2" data-reveal>
          Una consulta por WhatsApp vale una venta. Y hoy se pierde en el celular de un vendedor.
        </h2>
        <div>
          <ol className="lp-timeline">
            {TIMELINE.map((t, i) => (
              <li key={t.when} data-reveal style={d(i * 140)}>
                <time className="font-heading text-sm font-semibold tabular-nums text-[var(--lp-ink)]">
                  {t.when}
                </time>
                <p className="mt-1 text-[var(--lp-muted)]">{t.what}</p>
              </li>
            ))}
          </ol>
          <p className="lp-answer mt-10" data-reveal style={d(420)}>
            <strong>Con Atlas,</strong> el WhatsApp es de la agencia y no del vendedor: la consulta
            cae en una bandeja compartida, se convierte en lead con un clic y el supervisor ve qué
            quedó sin respuesta.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Cómo funciona ───────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Entra",
    text: "Por WhatsApp oficial, por formularios web o con tu base importada desde Excel. Todo cae en el mismo lugar.",
  },
  {
    n: "02",
    title: "Se trabaja",
    text: "Cada lead tiene vendedor, tareas con horario y recordatorios. Los que se enfrían pasan a remarketing.",
  },
  {
    n: "03",
    title: "Se cierra",
    text: "Cotizás con el auto del stock, simulás la cuota y registrás la venta. Vos lo ves en el dashboard.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="lp-section bg-[var(--lp-paper-2)]">
      <div className="lp-wrap">
        <h2 className="lp-h2 max-w-[22ch]" data-reveal>
          De la consulta a la venta, sin pasar por el Excel.
        </h2>
        <ol className="lp-steps mt-16" data-reveal>
          {STEPS.map((s, i) => (
            <li key={s.n} style={d(200 + i * 160)}>
              <span className="lp-steps__n">{s.n}</span>
              <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-[var(--lp-ink)]">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[30ch] text-[var(--lp-muted)]">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────── WhatsApp ─────────────────────────── */

const WA_POINTS = [
  {
    title: "API oficial de Meta",
    text: "Nada de apps no oficiales ni números bloqueados por escanear un QR.",
  },
  {
    title: "Se ve como WhatsApp Web",
    text: "Nadie tiene que aprender un sistema nuevo para responder.",
  },
  {
    title: "Del chat al lead en un clic",
    text: "Nombre, apellido y el auto del stock que consultó, sin tipear dos veces.",
  },
  {
    title: "Plantillas a un toque",
    text: "Respuestas con el nombre del cliente y el modelo, listas para mandar.",
  },
];

function WhatsAppSection() {
  return (
    <section id="whatsapp" className="lp-section lp-dark">
      <div className="lp-wrap grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div className="lg:order-2">
          <h2 className="lp-h2 text-[var(--lp-on-dark)]" data-reveal>
            El WhatsApp de la agencia, adentro del CRM.
          </h2>
          <p
            className="mt-6 max-w-[38ch] text-lg text-[var(--lp-on-dark-muted)]"
            data-reveal
            style={d(100)}
          >
            Tu equipo responde igual que siempre. Vos ves todas las conversaciones, y ninguna se
            pierde cuando un vendedor cambia de celular o se va.
          </p>
          <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WA_POINTS.map((p, i) => (
              <div key={p.title} data-reveal style={d(160 + i * 90)}>
                <dt className="flex items-center gap-2 font-heading font-semibold text-[var(--lp-on-dark)]">
                  <Check className="size-4 text-[var(--lp-wa)]" /> {p.title}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--lp-on-dark-muted)]">
                  {p.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:order-1" data-reveal>
          <WhatsAppMock />
        </div>
      </div>
    </section>
  );
}

function WhatsAppMock() {
  const chats = [
    {
      initials: "LF",
      name: "Lucas Ferreyra",
      last: "Dale. Tengo un Gol 2016…",
      time: "21:49",
      active: true,
      badge: "Lead",
    },
    {
      initials: "VS",
      name: "Valeria Sosa",
      last: "¿Aceptan permuta?",
      time: "21:12",
      badge: "Sin lead",
    },
    { initials: "GF", name: "Gustavo Ferreyra", last: "Gracias! El sábado paso", time: "19:30" },
    { initials: "CV", name: "Camila Vega", last: "¿Cuánto queda la cuota?", time: "18:05" },
  ];
  return (
    <div className="lp-wa" aria-hidden="true">
      <div className="lp-wa__list">
        <p className="px-4 pb-2 pt-4 font-heading text-sm font-semibold text-[var(--lp-ink)]">
          Chats
        </p>
        {chats.map((c) => (
          <div key={c.name} className="lp-wa__row" data-active={c.active || undefined}>
            <span className="lp-chat__avatar">{c.initials}</span>
            <div className="min-w-0 flex-1">
              <p className="flex justify-between gap-2 text-[12px] font-semibold text-[var(--lp-ink)]">
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 font-normal text-[var(--lp-muted)]">{c.time}</span>
              </p>
              <p className="truncate text-[11px] text-[var(--lp-muted)]">{c.last}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="lp-wa__lead">
        <p className="font-heading text-[13px] font-semibold text-[var(--lp-ink)]">
          Crear lead desde este chat
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Field label="Nombre" value="Lucas" />
          <Field label="Apellido" value="Ferreyra" />
        </div>
        <div className="mt-2.5">
          <Field
            label="Interesado en (stock)"
            value="Toyota Hilux SRV 2021"
            icon={<Car className="size-3.5" />}
          />
        </div>
        <div className="mt-2.5">
          <Field label="WhatsApp" value="+54 9 11 5832-4410" />
        </div>
        <span className="lp-wa__submit">
          <Check className="size-3.5" /> Lead creado y asignado a Martín P.
        </span>
      </div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--lp-muted)]">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 truncate rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] px-2.5 py-1.5 text-[12px] text-[var(--lp-ink)]">
        {icon}
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────── Producto ─────────────────────────── */

const RANKING = [
  { name: "Sofía Navarro", sales: 14, w: 1 },
  { name: "Martín Pereyra", sales: 11, w: 0.79 },
  { name: "Lucía Gómez", sales: 9, w: 0.64 },
  { name: "Federico Aguirre", sales: 6, w: 0.43 },
];

const MODULES = [
  { icon: Car, text: "Stock con fotos, precio y estado de cada unidad" },
  { icon: CalendarCheck, text: "Tareas y calendario de cada vendedor" },
  { icon: RefreshCcw, text: "Remarketing de los leads que se enfriaron" },
  { icon: BarChart3, text: "Reportes de conversión y tiempo de respuesta" },
  { icon: ShieldCheck, text: "Usuarios, roles y registro de auditoría" },
  { icon: FileSpreadsheet, text: "Importación de leads desde Excel" },
  { icon: Target, text: "Objetivos y comisiones del equipo" },
  { icon: Sparkles, text: "Asistente y agente con IA, en los planes premium" },
];

function Product() {
  return (
    <section id="producto" className="lp-section">
      <div className="lp-wrap">
        <h2 className="lp-h2 max-w-[20ch]" data-reveal>
          Todo lo que pasa en el salón, en una pantalla.
        </h2>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <article className="lp-tile" data-reveal>
            <header className="flex items-baseline justify-between gap-4">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-[var(--lp-ink)]">
                Cotizador y simulador de cuotas
              </h3>
              <span className="lp-tag">Ejemplo</span>
            </header>
            <p className="mt-2 max-w-[44ch] text-[var(--lp-muted)]">
              Elegís el auto del stock, el anticipo y el plazo. El cliente se va con la cuota por
              WhatsApp antes de salir del salón.
            </p>
            <div className="lp-quote mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--lp-muted)]">
                    Toyota Hilux SRV 2021 · 58.000 km
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-[var(--lp-ink)]">
                    $ 38.900.000
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--lp-muted)]">36 cuotas de</p>
                  <p className="font-heading text-3xl font-semibold text-[var(--lp-accent-ink)]">
                    <CountUp value={812400} prefix="$ " />
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-xs text-[var(--lp-muted)]">
                  <span>Anticipo 40% · $ 15.560.000</span>
                  <span>Financiado 60%</span>
                </div>
                <div className="lp-split mt-2">
                  <span className="lp-split__a" />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                {[12, 24, 36, 48].map((n) => (
                  <span key={n} className="lp-term" data-on={n === 36 || undefined}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="lp-tile" data-reveal style={d(120)}>
            <h3 className="font-heading text-xl font-semibold tracking-tight text-[var(--lp-ink)]">
              Ranking del mes
            </h3>
            <p className="mt-2 text-[var(--lp-muted)]">
              Cada vendedor sabe dónde está. Vos sabés a quién darle los mejores leads.
            </p>
            <ol className="lp-rank mt-8 space-y-5">
              {RANKING.map((r, i) => (
                <li key={r.name} style={{ ...d(300 + i * 110), "--w": r.w } as CSSProperties}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-[var(--lp-ink)]">
                      <span className="mr-2 tabular-nums text-[var(--lp-muted)]">{i + 1}</span>
                      {r.name}
                    </span>
                    <span className="font-heading font-semibold text-[var(--lp-ink)]">
                      <CountUp value={r.sales} duration={1100} /> ventas
                    </span>
                  </div>
                  <span className="lp-rank__bar mt-2">
                    <span />
                  </span>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <ul className="mt-14 grid gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ icon: Icon, text }, i) => (
            <li key={text} className="lp-module" data-reveal style={d((i % 4) * 70)}>
              <Icon className="size-4 shrink-0 text-[var(--lp-accent-ink)]" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────── Roles ──────────────────────────── */

const ROLES = [
  { role: "Dueño", sees: "La agencia completa: dashboard, reportes, auditoría y configuración." },
  { role: "Supervisor", sees: "Su equipo: tareas vencidas, ranking y tiempos de respuesta." },
  { role: "Vendedor", sees: "Lo suyo: sus leads, sus chats y sus tareas del día." },
  { role: "Recepción", sees: "Carga las consultas del salón y las deriva al vendedor." },
];

function Roles() {
  return (
    <section className="lp-section border-t border-[var(--lp-line)]">
      <div className="lp-wrap grid gap-12 lg:grid-cols-[0.9fr_1.6fr] lg:gap-20">
        <h2 className="lp-h2" data-reveal>
          Vos ves todo. Cada vendedor ve lo suyo.
        </h2>
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-line)] sm:grid-cols-2">
          {ROLES.map((r, i) => (
            <div key={r.role} className="bg-[var(--lp-paper)] p-6" data-reveal style={d(i * 90)}>
              <dt className="font-heading text-lg font-semibold text-[var(--lp-ink)]">{r.role}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">{r.sees}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ──────────────────────────── Planes ──────────────────────────── */

const PLANS = [
  {
    name: "Core",
    tagline: "Para que el equipo venda ordenado.",
    items: ["Leads y pipeline", "Stock y clientes", "Tareas, usuarios y reportes"],
  },
  {
    name: "Growth",
    tagline: "Más cotizaciones, más cierres.",
    items: ["Cotizador y simulador", "Objetivos y comisiones", "Ranking y plantillas"],
    pick: true,
  },
  {
    name: "Automation",
    tagline: "Menos tareas repetitivas.",
    items: ["Seguimientos automáticos", "Asignación de leads", "Integración con formularios"],
  },
  {
    name: "AI Assist",
    tagline: "Un copiloto para decidir mejor.",
    items: ["Resumen de conversaciones", "Priorización de leads", "Próximo paso sugerido"],
  },
  {
    name: "AI Agent",
    tagline: "Leads calificados, sin esfuerzo.",
    items: ["Primer contacto automático", "Calificación y agenda", "Derivación al vendedor"],
  },
];

function Plans() {
  return (
    <section id="planes" className="lp-section bg-[var(--lp-paper-2)]">
      <div className="lp-wrap">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="lp-h2 max-w-[22ch]" data-reveal>
            Arrancá por lo esencial. Sumá módulos cuando el equipo los pida.
          </h2>
          <p className="max-w-[34ch] text-[var(--lp-muted)]" data-reveal style={d(100)}>
            El precio depende del tamaño de tu equipo y los módulos. Te lo pasamos en la demo, sin
            vueltas.
          </p>
        </div>

        <ol className="lp-ladder mt-16">
          {PLANS.map((p, i) => (
            <li
              key={p.name}
              className="lp-step"
              data-pick={p.pick || undefined}
              data-reveal
              style={{ ...d(i * 90), "--rise": i } as CSSProperties}
            >
              {p.pick && <span className="lp-step__flag">Recomendado</span>}
              <p className="text-xs font-semibold tabular-nums text-[var(--lp-muted)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-[var(--lp-ink)]">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--lp-muted)]">{p.tagline}</p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--lp-ink)]">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--lp-accent-ink)]" />
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-5" data-reveal>
          <a href="#demo" className="lp-btn">
            Pedir una demo <ArrowRight className="lp-btn__arrow size-4" />
          </a>
          <p className="text-sm text-[var(--lp-muted)]">El plan Core está siempre incluido.</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── FAQ ───────────────────────────── */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Mis vendedores no van a querer usar otro sistema.",
    a: "Por eso el módulo de WhatsApp se ve igual que WhatsApp Web y crear un lead lleva un clic. El que hoy responde por WhatsApp ya sabe usar Atlas.",
  },
  {
    q: "¿Me pueden bloquear el número de WhatsApp?",
    a: "Atlas no usa apps no oficiales que escanean un QR. Se conecta por la API de WhatsApp Business de Meta, que es el canal pensado para empresas.",
  },
  {
    q: "¿Tengo que cargar todo de nuevo?",
    a: "No. Importás tu base de leads desde Excel y el stock se carga una sola vez, con fotos y precio.",
  },
  {
    q: "¿Cuánto cuesta el WhatsApp?",
    a: "Responderle a un cliente que te escribió no tiene costo dentro de las 24 horas. Los mensajes que inicia la agencia, como una campaña o un recordatorio, los cobra Meta por mensaje. En la demo te calculamos el número según tu volumen.",
  },
  {
    q: "¿Quién ve la información de la agencia?",
    a: "Cada persona entra con su usuario y su rol. El dueño ve todo, el vendedor ve lo suyo, y las acciones importantes quedan en el registro de auditoría.",
  },
  {
    q: "¿Puedo verlo antes de hablar con ustedes?",
    a: (
      <>
        Sí. Entrá a la{" "}
        <a href={DEMO_URL} className="lp-inline-link">
          demo en vivo
        </a>{" "}
        con datos de prueba y elegí un perfil: dueño, supervisor, vendedor o recepción.
      </>
    ),
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="preguntas" className="lp-section">
      <div className="lp-wrap grid gap-12 lg:grid-cols-[0.9fr_1.6fr] lg:gap-20">
        <h2 className="lp-h2" data-reveal>
          Lo que nos preguntan antes de arrancar.
        </h2>
        <div className="border-t border-[var(--lp-line)]" data-reveal style={d(100)}>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="lp-faq" data-open={isOpen || undefined}>
                <h3>
                  <button
                    type="button"
                    className="lp-faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {item.q}
                    <ChevronDown className="lp-faq__chev size-5 shrink-0" />
                  </button>
                </h3>
                <div id={`faq-${i}`} className="lp-faq__a" role="region">
                  <div inert={!isOpen}>
                    <p className="max-w-[60ch] pb-6 text-[var(--lp-muted)]">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── CTA final ───────────────────────────── */

const TEAM_SIZES = [
  { label: "1 a 3", phrase: "entre 1 y 3" },
  { label: "4 a 10", phrase: "entre 4 y 10" },
  { label: "Más de 10", phrase: "más de 10" },
];

function FinalCta() {
  const [name, setName] = useState("");
  const [agency, setAgency] = useState("");
  const [team, setTeam] = useState(TEAM_SIZES[1]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const text =
      `Hola! Soy ${name.trim()}, de ${agency.trim()}. ` +
      `Tenemos ${team.phrase} vendedores y quiero ver una demo de Atlas Sales OS.`;
    window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="demo" className="lp-final">
      <svg className="lp-final__mark" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 6 96 92H73L50 48 27 92H4L50 6Z" />
      </svg>
      <div className="lp-wrap relative grid gap-14 py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-32">
        <div>
          <h2 className="lp-h2 text-[var(--lp-on-dark)]" data-reveal>
            Tu próxima venta ya está escribiendo por WhatsApp.
          </h2>
          <p
            className="mt-6 max-w-[40ch] text-lg text-[var(--lp-on-dark-muted)]"
            data-reveal
            style={d(100)}
          >
            Contanos de tu agencia y coordinamos una demo con tu stock real.
          </p>
        </div>

        <form className="lp-form" onSubmit={submit} data-reveal style={d(160)}>
          <label className="lp-label">
            Tu nombre
            <input
              className="lp-input"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </label>
          <label className="lp-label">
            Concesionaria o agencia
            <input
              className="lp-input"
              required
              autoComplete="organization"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="Ej. Pérez Automotores"
            />
          </label>
          <fieldset>
            <legend className="lp-label">¿Cuántos vendedores son?</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TEAM_SIZES.map((size) => (
                <label key={size.label} className="lp-choice">
                  <input
                    type="radio"
                    name="team"
                    value={size.label}
                    checked={team === size}
                    onChange={() => setTeam(size)}
                  />
                  <span>{size.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="lp-btn lp-btn--light mt-2 w-full justify-center">
            Pedir la demo por WhatsApp <ArrowUpRight className="lp-btn__arrow size-4" />
          </button>
          <p className="text-center text-xs text-[var(--lp-on-dark-muted)]">
            Se abre WhatsApp con el mensaje listo. No guardamos tus datos.
          </p>
        </form>
      </div>
    </section>
  );
}

/* ───────────────────────────── Footer ───────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[var(--lp-panel)] text-[var(--lp-on-dark-muted)]">
      <div className="lp-wrap flex flex-col gap-6 border-t border-[oklch(1_0_0/0.08)] py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-[var(--lp-on-dark)]">
          <AtlasLogo className="size-6" />
          <span>
            <span className="font-heading font-semibold">Atlas Sales OS</span>
            <span className="ml-3 text-[var(--lp-on-dark-muted)]">
              Menos tiempo cargando. Más tiempo vendiendo.
            </span>
          </span>
        </div>
        <div className="flex gap-6">
          <a href={DEMO_URL} className="lp-navlink lp-navlink--dark">
            Ingresar
          </a>
          <a href="#demo" className="lp-navlink lp-navlink--dark">
            Pedir demo
          </a>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
