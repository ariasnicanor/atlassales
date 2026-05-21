import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu, X, Instagram, MapPin, Phone, Mail, Clock,
  Zap, Monitor, Gamepad2, Volume2, Car, Trophy, ChevronDown,
  Calendar, Tag, DollarSign, Sparkles, Send, MessageSquarePlus,
} from "lucide-react";
import heroImg from "@/assets/hero-pilotos.jpg";
import salaImg from "@/assets/gallery-sala.jpg";
import volanteImg from "@/assets/gallery-volante.jpg";
import auricularesImg from "@/assets/gallery-auriculares.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Technology />
      <Pricing />
      <Experience />
      <Testimonials />
      <Reservation />
      <Feedback />
      <Contact />
      <Footer />
    </div>
  );
}

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#simuladores", label: "Simuladores" },
  { href: "#experiencia", label: "Experiencia" },
  { href: "#reservas", label: "Reservas" },
  { href: "#contacto", label: "Contacto" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="grid h-10 w-10 place-items-center rounded-md border border-primary bg-background font-display text-xs font-black text-primary">
        VR
      </div>
      <span className="font-display text-lg font-black tracking-widest text-foreground">
        VIA RACER
      </span>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio"><Logo /></a>
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-muted-foreground transition hover:text-primary">
              {l.label}
            </a>
          ))}
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            🏁 Zona Competiciones
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#reservas" className="hidden rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-glow transition hover:scale-105 sm:inline-block">
            Reserva Ahora
          </a>
          <button className="lg:hidden" onClick={() => setOpen((s) => !s)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/40 bg-background lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-primary">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <img src={heroImg} alt="Pilotos" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,oklch(0.13_0.01_80)_85%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="mb-4 font-display text-sm font-bold tracking-[0.4em] text-primary">VIA RACER</p>
        <h1 className="font-display text-5xl font-black leading-none text-foreground sm:text-7xl lg:text-8xl">
          SENTÍ LA <span className="text-primary text-glow">VELOCIDAD REAL</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Experimentá la adrenalina de la pista en nuestros simuladores de última generación. Competí, mejorá tus tiempos y convertite en el más rápido.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm backdrop-blur">
            <Clock className="h-4 w-4 text-primary" /> Lunes a Sábados: 10:00 a 01:00
          </span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm backdrop-blur">
            <Clock className="h-4 w-4 text-primary" /> Domingos: 14:00 a 24:00
          </span>
        </div>
        <a
          href="https://www.instagram.com/via_racer"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          <Instagram className="h-4 w-4" /> @via_racer
        </a>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#reservas" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:scale-105">
            <Car className="h-4 w-4" /> Reservá tu Carrera
          </a>
          <a href="#simuladores" className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
            Descubrí Más
          </a>
          <a href="#experiencia" className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/10">
            <Trophy className="h-4 w-4" /> Récords de Circuitos
          </a>
        </div>
      </div>

      <a href="#simuladores" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary" aria-label="Scroll">
        <ChevronDown className="h-7 w-7 animate-bounce" />
      </a>
    </section>
  );
}

const techItems = [
  { icon: Zap, title: "Alta Potencia", desc: "Sentí cada aceleración y frenada con nuestros simuladores de última generación y respuesta inmediata." },
  { icon: Monitor, title: "Pantallas Inmersivas", desc: "Pantallas 55\" QLED para un campo de visión panorámico que te mete dentro de la pista." },
  { icon: Gamepad2, title: "Controles Profesionales", desc: "Volantes Direct Drive y pedales con célula de carga para una precisión y feedback de fuerza realistas." },
  { icon: Volume2, title: "Sonido Envolvente", desc: "Escuchá el rugido del motor y cada detalle del entorno con un sistema de audio envolvente de alta fidelidad." },
];

function Technology() {
  return (
    <section id="simuladores" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-black text-foreground sm:text-5xl">
            NUESTRA <span className="text-primary text-glow">TECNOLOGÍA</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sumérgete en la simulación más avanzada con hardware y software de nivel profesional.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {techItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/60 hover:shadow-glow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Tab = "horarios" | "precios" | "promos";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "horarios", label: "Horarios", icon: Clock },
  { id: "precios", label: "Precios", icon: DollarSign },
  { id: "promos", label: "Promos", icon: Tag },
];

function Pricing() {
  const [tab, setTab] = useState<Tab>("precios");
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-display text-4xl font-black sm:text-5xl">
          NUESTROS <span className="text-primary text-glow">PRECIOS</span>
        </h2>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card p-2">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-4 text-sm font-bold transition ${
                    active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                  {t.id === "promos" && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] text-white">3</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-background/60 p-6 text-center text-sm text-muted-foreground">
            {tab === "horarios" && (
              <ul className="space-y-2 text-left">
                <li className="flex justify-between"><span>Lunes a Sábados</span><span className="font-bold text-primary">10:00 – 01:00</span></li>
                <li className="flex justify-between"><span>Domingos</span><span className="font-bold text-primary">14:00 – 24:00</span></li>
              </ul>
            )}
            {tab === "precios" && (
              <ul className="space-y-2 text-left">
                <li className="flex justify-between"><span>1 hora / 1 puesto</span><span className="font-bold text-primary">$8.000</span></li>
                <li className="flex justify-between"><span>2 horas / 1 puesto</span><span className="font-bold text-primary">$15.000</span></li>
                <li className="flex justify-between"><span>Carrera grupal (6 puestos)</span><span className="font-bold text-primary">$42.000</span></li>
              </ul>
            )}
            {tab === "promos" && (
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /> Happy Hour: lunes a jueves de 15 a 18hs, 20% off.</li>
                <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /> Cumpleaños: reservá 4 puestos y el cumpleañero corre gratis.</li>
                <li className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /> Combo amigos: 6 puestos x 2 hs con descuento especial.</li>
              </ul>
            )}
          </div>
          <p className="py-3 text-center text-xs text-muted-foreground">Tocá una sección para ver el detalle</p>
        </div>
      </div>
    </section>
  );
}

const gallery = [
  { img: salaImg, title: "Nuestra Sala", alt: "Sala de simuladores Via Racer" },
  { img: volanteImg, title: "Tecnología Profesional", alt: "Volante profesional" },
  { img: auricularesImg, title: "Audio Profesional", alt: "Auriculares gaming profesionales" },
];

function Experience() {
  return (
    <section id="experiencia" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-black sm:text-5xl">
            LA EXPERIENCIA <span className="text-primary text-glow">VIA RACER</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            No es solo un juego, es la competición en estado puro. Mirá lo que dicen nuestros pilotos.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {gallery.map((g) => (
            <figure key={g.title} className="group relative overflow-hidden rounded-2xl border border-border">
              <img src={g.img} alt={g.alt} width={1024} height={768} loading="lazy" className="h-72 w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 right-0 p-5">
                <p className="font-display text-lg font-bold text-primary">{g.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { initial: "C", name: "Carlos R.", role: "Evento Grupal", text: "Fuimos con amigos y fue la mejor experiencia. La competición entre nosotros fue épica. Las pantallas y el sonido te meten en la carrera. ¡Volveremos seguro!" },
  { initial: "J", name: "Julieta Garcia", role: "Principiante", text: "Estuvo muy bueno: imagen, sonido, volante... todo genial. Vuelvo con mi familia seguro." },
];

function Testimonials() {
  return (
    <section className="relative py-12">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2">
        {testimonials.map((t) => (
          <blockquote key={t.name} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-muted-foreground">"{t.text}"</p>
            <footer className="mt-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                {t.initial}
              </span>
              <div>
                <p className="font-display font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function Reservation() {
  const [hours, setHours] = useState(1);
  const [seats, setSeats] = useState(1);
  return (
    <section id="reservas" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-black sm:text-5xl">
            RESERVÁ <span className="text-primary text-glow">TU SESIÓN</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Completá el formulario para asegurar tu lugar en la parrilla de salida.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); alert("¡Reserva enviada! Te contactaremos para confirmarla."); }}
          className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <h3 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Car className="h-5 w-5" /> Reservar
          </h3>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Tu Nombre">
              <input required type="text" placeholder="Ingresá tu nombre" className="input" />
            </Field>
            <Field label="Tu Teléfono *">
              <input required type="tel" placeholder="Ej: 2664123456" className="input" />
            </Field>
            <Field label="Fecha">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input required type="date" className="input pl-9" />
              </div>
            </Field>
            <Field label="Hora de inicio">
              <select className="input">
                <option>Elegí un horario</option>
                {["10:00","12:00","14:00","16:00","18:00","20:00","22:00"].map((h) => <option key={h}>{h}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">¿Cuántas horas?</p>
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map((h) => (
                <button type="button" key={h} onClick={() => setHours(h)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${hours===h ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border text-muted-foreground hover:text-primary"}`}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">¿Cuántos puestos?</p>
            <div className="grid grid-cols-6 gap-2">
              {[1,2,3,4,5,6].map((n) => (
                <button type="button" key={n} onClick={() => setSeats(n)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${seats===n ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border text-muted-foreground hover:text-primary"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="mt-8 w-full rounded-xl bg-primary py-3 font-display font-bold text-primary-foreground shadow-glow transition hover:scale-[1.01]">
            Reservar
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Tu reserva será revisada y aprobada por el administrador
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Feedback() {
  const [msg, setMsg] = useState("");
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center">
          <MessageSquarePlus className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">
            TU EXPERIENCIA <span className="text-primary text-glow">NOS MOTIVA</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Ayudanos a mejorar, dejá tus comentarios y sugerencias</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); alert("¡Gracias por tu comentario!"); setMsg(""); }}
          className="mt-8 rounded-2xl border border-border bg-card p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre *"><input required className="input" placeholder="Tu nombre" /></Field>
            <Field label="Celular *"><input required className="input" placeholder="Ej: 2664123456" /></Field>
          </div>
          <div className="mt-4">
            <Field label="Comentario / Sugerencia *">
              <textarea required maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)}
                rows={4} placeholder="Contanos tu experiencia o dejanos tu sugerencia..." className="input resize-none" />
            </Field>
            <p className="mt-1 text-right text-xs text-muted-foreground">{msg.length}/1000</p>
          </div>
          <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display font-bold text-primary-foreground shadow-glow transition hover:scale-[1.01]">
            <Send className="h-4 w-4" /> Enviar comentario
          </button>
        </form>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contacto" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-4xl font-black sm:text-5xl">
            VENÍ A <span className="text-primary text-glow">CORRER</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Estamos listos para recibirte. Contactanos para reservas de grupos, eventos o cualquier consulta.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-primary">Información de Contacto</h3>
            <ul className="mt-5 space-y-5 text-sm">
              <ContactRow icon={MapPin} title="Dirección" value="Tomás Jofré 1122, San Luis, Argentina" />
              <ContactRow icon={Phone} title="Teléfono / WhatsApp" value="+54 266 431-4118" href="tel:+542664314118" />
              <ContactRow icon={Mail} title="Email" value="viaracersl@gmail.com" href="mailto:viaracersl@gmail.com" />
              <ContactRow icon={Instagram} title="Instagram" value="@via_racer" href="https://www.instagram.com/via_racer" />
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-primary">Horarios</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex justify-between border-b border-border/40 pb-3">
                <span className="text-muted-foreground">Lunes a Sábados</span>
                <span className="font-bold">10:00 – 01:00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Domingos</span>
                <span className="font-bold">14:00 – 24:00</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-bold text-primary">¿Qué incluye?</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {["6 simuladores profesionales de carreras","Aire acondicionado","Zona de espera cómoda","Asesoramiento técnico durante la sesión","Récords de circuitos y rankings"].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ icon: Icon, title, value, href }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-display text-sm font-bold">{title}</p>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </div>
  );
  return <li>{href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block transition hover:text-primary">{content}</a> : content}</li>;
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row">
        <Logo />
        <p>© 2026 Via Racer. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
