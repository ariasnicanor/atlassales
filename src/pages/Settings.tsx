import { useState } from "react";
import { Waves, Palette, Save, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";

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
  const { company, updateCompany } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry,
    slogan: company.slogan ?? "",
    logo_url: company.logo_url ?? "",
    primary_color: company.primary_color,
    secondary_color: company.secondary_color,
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
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
        title="Branding"
        description="Personalizá la identidad visual del sistema para tu empresa."
        badge={<Badge variant="secondary"><Palette className="size-3" /> Core</Badge>}
      />

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
              <Button onClick={save}><Save className="size-4" /> Guardar branding</Button>
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

        {/* Preview */}
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
    </div>
  );
}
