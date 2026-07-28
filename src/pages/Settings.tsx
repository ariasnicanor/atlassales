import { useEffect, useMemo, useState } from "react";
import { Waves, Palette, Save, RotateCcw, UserRound, Lock, Calendar, RefreshCw, Link2, Unlink, Target, Shuffle, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { can, roleLabel } from "@/lib/permissions";
import { FEATURES, hasFeature, featureDefault } from "@/lib/features";
import { Switch } from "@/components/ui/switch";
import {
  getConnection,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  hasRealCredentials,
  pullEventsFromGoogle,
  type GCalConnection,
} from "@/lib/google-calendar";
import {
  getTrackingConfig,
  saveTrackingConfig,
  hasMetaPixel,
  hasGoogleAds,
  type TrackingConfig,
} from "@/lib/tracking";

const INDUSTRIES = [
  "Concesionaria",
  "Inmobiliaria",
  "Distribuidor",
  "Maquinaria",
  "Servicios",
  "Equipamiento industrial",
  "Otro",
];

export default function Settings() {
  const { company, updateCompany, updateUser } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();
  const isAdmin = can(currentUser, "manage_company");

  // ── Mi perfil (todos los roles) ──────────────────────────────
  const [first, ...rest] = (currentUser?.name ?? "").split(" ");
  const [profile, setProfile] = useState({
    nombre: first ?? "",
    apellido: rest.join(" "),
    phone: currentUser?.phone ?? "",
    email: currentUser?.email ?? "",
  });
  const setP = (k: keyof typeof profile, v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const saveProfile = () => {
    if (!currentUser) return;
    updateUser(currentUser.id, {
      name: `${profile.nombre} ${profile.apellido}`.trim(),
      phone: profile.phone || null,
      email: profile.email,
    });
    toast("Perfil actualizado ✅");
  };

  // ── Branding empresa (solo admin) ────────────────────────────
  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry,
    slogan: company.slogan ?? "",
    logo_url: company.logo_url ?? "",
    primary_color: company.primary_color,
    secondary_color: company.secondary_color,
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const saveBranding = () => {
    updateCompany({
      name: form.name,
      industry: form.industry,
      slogan: form.slogan || null,
      logo_url: form.logo_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
    });
    toast("Branding actualizado ✨");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestioná tu perfil y, si sos admin, la identidad de la empresa."
        badge={<Badge variant="secondary"><Palette className="size-3" /> Core</Badge>}
      />

      {currentUser && hasFeature(currentUser, "integrations") && <IntegrationsSection userId={currentUser.id} userEmail={currentUser.email ?? ""} />}
      {hasFeature(currentUser, "pixel_config") && <PixelSection />}
      {(currentUser?.role === "admin" || currentUser?.role === "supervisor") && <LeadDistributionSection />}
      {isAdmin && <FeatureOverridesSection />}



      {/* Mi perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={currentUser?.name ?? "?"} src={currentUser?.avatar_url} size="lg" />
            <div>
              <p className="font-medium">{currentUser?.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser ? roleLabel(currentUser.role) : ""}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input value={profile.nombre} onChange={(e) => setP("nombre", e.target.value)} /></Field>
            <Field label="Apellido"><Input value={profile.apellido} onChange={(e) => setP("apellido", e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono"><Input value={profile.phone} onChange={(e) => setP("phone", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setP("email", e.target.value)} /></Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile}><Save className="size-4" /> Guardar perfil</Button>
          </div>
        </CardContent>
      </Card>

      {/* Branding empresa: solo admin */}
      {isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Identidad de la empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Nombre de la empresa">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rubro">
                  <Select value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </Select>
                </Field>
                <Field label="Logo (URL)" hint="Opcional">
                  <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
                </Field>
              </div>
              <Field label="Slogan" hint="Opcional">
                <Input value={form.slogan} onChange={(e) => set("slogan", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Color primario">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border" />
                    <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} />
                  </div>
                </Field>
                <Field label="Color secundario">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border" />
                    <Input value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} />
                  </div>
                </Field>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveBranding}><Save className="size-4" /> Guardar branding</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    set("primary_color", "#0EA5E9");
                    set("secondary_color", "#7C3AED");
                  }}
                >
                  <RotateCcw className="size-4" /> Colores por defecto
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Vista previa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex items-center gap-3 rounded-xl p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})` }}
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/20">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" className="size-8 rounded object-cover" />
                  ) : (
                    <Waves className="size-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{form.name || "Tu empresa"}</p>
                  <p className="truncate text-xs text-white/80">{form.slogan || form.industry}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: form.primary_color }}>
                  Botón primario
                </button>
                <button className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: form.secondary_color }}>
                  Botón secundario
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Los cambios de color se aplican en toda la app al guardar.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <Lock className="size-5 shrink-0" />
            La configuración de la empresa (nombre, logo, colores) la gestiona el <strong className="mx-1">Administrador</strong>.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IntegrationsSection({ userId, userEmail }: { userId: string; userEmail: string }) {
  const { toast } = useToast();
  const [conn, setConn] = useState<GCalConnection>(() => getConnection(userId));
  const [loading, setLoading] = useState(false);
  const isReal = hasRealCredentials();

  useEffect(() => {
    const refresh = () => setConn(getConnection(userId));
    window.addEventListener("gcal:changed", refresh);
    return () => window.removeEventListener("gcal:changed", refresh);
  }, [userId]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const next = await connectGoogleCalendar(userId, userEmail);
      setConn(next);
      toast(isReal ? "Google Calendar conectado ✅" : "Conexión simulada activa ✅");
    } catch {
      toast("No se pudo conectar con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleCalendar(userId);
    setConn(getConnection(userId));
    toast("Google Calendar desconectado");
  };

  const handleSync = () => {
    const events = pullEventsFromGoogle(userId);
    setConn(getConnection(userId));
    toast(`Sincronización completada — ${events.length} evento(s)`);
  };

  const connected = conn.status === "connected";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" /> Integraciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Google Calendar</p>
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "Conectado" : "Desconectado"}
                </Badge>
                {!isReal && (
                  <Badge variant="outline" className="text-xs">Modo simulado</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sincroniza eventos, tareas y seguimientos de leads en ambos sentidos con tu calendario.
              </p>
              {connected && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cuenta: <strong>{conn.email}</strong>
                  {conn.last_sync_at && (
                    <> · Última sync: {new Date(conn.last_sync_at).toLocaleString()}</>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {connected ? (
              <>
                <Button variant="outline" onClick={handleSync}>
                  <RefreshCw className="size-4" /> Sincronizar ahora
                </Button>
                <Button variant="outline" onClick={handleDisconnect}>
                  <Unlink className="size-4" /> Desconectar
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={loading}>
                <Link2 className="size-4" /> {loading ? "Conectando..." : "Conectar Google"}
              </Button>
            )}
          </div>
        </div>

        {!isReal && (
          <p className="text-xs text-muted-foreground">
            Aún no hay credenciales de Google configuradas. La conexión está simulada y la estructura de
            sincronización ya está lista: al agregar <code>VITE_GOOGLE_CLIENT_ID</code> se activa el OAuth real
            sin cambios en la interfaz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PixelSection() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<TrackingConfig>(() => getTrackingConfig());
  const set = (k: keyof TrackingConfig, v: string) => setCfg((c) => ({ ...c, [k]: v }));

  const save = () => {
    saveTrackingConfig(cfg);
    toast("Pixeles guardados ✅");
  };

  const metaOk = hasMetaPixel(cfg);
  const adsOk = hasGoogleAds(cfg);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" /> Pixel y campañas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cargá los IDs de tus pixeles para medir conversiones desde Meta Ads y Google Ads.
          Los eventos <code>Lead</code> / <code>conversion</code> se disparan automáticamente al crear un lead
          que viene de una campaña (con <code>utm_source</code>, <code>gclid</code> o <code>fbclid</code>).
        </p>

        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">Meta / Facebook Pixel</p>
            <Badge variant={metaOk ? "default" : "secondary"}>
              {metaOk ? "Activo" : "Sin configurar"}
            </Badge>
          </div>
          <Field label="ID del Pixel de Meta" hint="Ej: 1234567890123456 (solo números)">
            <Input
              value={cfg.meta_pixel_id}
              onChange={(e) => set("meta_pixel_id", e.target.value.trim())}
              placeholder="1234567890123456"
              inputMode="numeric"
            />
          </Field>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">Google Ads</p>
            <Badge variant={adsOk ? "default" : "secondary"}>
              {adsOk ? "Activo" : "Sin configurar"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ID de conversión" hint="Ej: AW-123456789">
              <Input
                value={cfg.google_ads_id}
                onChange={(e) => set("google_ads_id", e.target.value.trim())}
                placeholder="AW-123456789"
              />
            </Field>
            <Field label="Etiqueta de conversión (Lead)" hint="Opcional — send_to = AW-XXX/LABEL">
              <Input
                value={cfg.google_ads_lead_label}
                onChange={(e) => set("google_ads_lead_label", e.target.value.trim())}
                placeholder="abcDEFghi123"
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save}><Save className="size-4" /> Guardar pixeles</Button>
        </div>

        <p className="text-xs text-muted-foreground">
          También podés definirlos con variables de entorno: <code>VITE_META_PIXEL_ID</code>,{" "}
          <code>VITE_GOOGLE_ADS_ID</code> y <code>VITE_GOOGLE_ADS_LEAD_LABEL</code>. Los valores guardados acá
          tienen prioridad y se aplican al instante en toda la app.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Funciones por usuario (Admin) — overrides finos sobre ROLE_MATRIX
// ─────────────────────────────────────────────────────────────
function FeatureOverridesSection() {
  const { users, updateUser } = useData();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>(() => users[0]?.id ?? "");
  const user = users.find((u) => u.id === selectedId) ?? users[0];

  if (!user) return null;

  const applicable = FEATURES.filter((f) => f.appliesTo.includes(user.role));

  const setOverride = (key: string, value: boolean | null) => {
    const next = { ...(user.feature_overrides ?? {}) };
    if (value === null) delete next[key];
    else next[key] = value;
    updateUser(user.id, { feature_overrides: next });
    toast(`Función actualizada para ${user.name}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5 text-primary" /> Funciones por usuario
          <Badge variant="secondary">Admin</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Usuario">
          <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {roleLabel(u.role)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="divide-y rounded-xl border">
          {applicable.map((f) => {
            const override = user.feature_overrides?.[f.key];
            const active = hasFeature(user, f.key);
            const base = featureDefault(f, user);
            return (
              <div key={f.key} className="flex items-start justify-between gap-4 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{f.label}</p>
                    {typeof override === "boolean" ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Forzado {override ? "ON" : "OFF"}
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="text-[10px]">
                        Default rol: {base ? "ON" : "OFF"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                  {typeof override === "boolean" && (
                    <button
                      type="button"
                      onClick={() => setOverride(f.key, null)}
                      className="mt-1 text-[11px] text-primary hover:underline"
                    >
                      Volver al default del rol
                    </button>
                  )}
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={(v) => setOverride(f.key, v)}
                  aria-label={f.label}
                />
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Los cambios se aplican en tiempo real — el usuario los ve sin necesidad de volver a loguearse.
          Los overrides se suman por encima del rol: podés activar una función bloqueada por default o
          bloquear una habilitada.
        </p>
      </CardContent>
    </Card>
  );
}

