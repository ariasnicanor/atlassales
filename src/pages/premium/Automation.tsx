import { Zap, Plus, GitBranch, Bell, Webhook, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";
import type { AutomationAction, AutomationTrigger } from "@/types";

const TRIGGER_LABEL: Record<AutomationTrigger, string> = {
  lead_creado: "Cuando se crea un lead",
  lead_cotizado: "Cuando un lead pasa a Cotizado",
  sin_respuesta: "Cuando no hay respuesta",
  cotizacion_aceptada: "Cuando se acepta una cotización",
  lead_caliente: "Cuando un lead se marca caliente",
};

const ACTION_LABEL: Record<AutomationAction, string> = {
  crear_recordatorio: "Crear recordatorio",
  crear_tarea: "Crear tarea de seguimiento",
  cambiar_estado: "Cambiar estado del lead",
  asignar_vendedor: "Asignar vendedor",
  notificar: "Enviar notificación",
};

function AutomationInner() {
  const { automationRules, toggleAutomation } = useData();
  const { toast } = useToast();

  const features = [
    { icon: Bell, title: "Recordatorios automáticos", desc: "Al crear un lead, tras cotizar o si no hay respuesta." },
    { icon: GitBranch, title: "Seguimientos automáticos", desc: "Reglas por estado: ej. Cotizado → tarea en 48 hs." },
    { icon: Shuffle, title: "Asignación automática", desc: "Por ronda, disponibilidad, rubro/marca u origen." },
    { icon: Webhook, title: "Integraciones", desc: "Recibí leads desde formularios y campañas vía API." },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="space-y-2 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><f.icon className="size-5" /></div>
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Reglas de automatización</CardTitle>
          <Button variant="outline" size="sm" onClick={() => toast("En la versión completa podés crear reglas a medida", "info")}>
            <Plus className="size-4" /> Nueva regla
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {automationRules.map((r) => (
            <div key={r.id} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Zap className="size-5 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">SI</span> {TRIGGER_LABEL[r.trigger]} → <span className="font-medium text-foreground">ENTONCES</span> {ACTION_LABEL[r.action]}
                </p>
              </div>
              <Badge variant={r.active ? "success" : "muted"}>{r.active ? "Activa" : "Pausada"}</Badge>
              <Switch checked={r.active} onCheckedChange={() => { toggleAutomation(r.id); toast(r.active ? "Regla pausada" : "Regla activada"); }} aria-label="Activar regla" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Automation() {
  return (
    <div className="space-y-6">
      <PageHeader title="Automation Package" description="Menos tareas repetitivas. Mayor capacidad operativa." badge={<Badge variant="secondary">Premium</Badge>} />
      <UpgradeGate tier="automation" preview={<Card className="h-72" />}><AutomationInner /></UpgradeGate>
    </div>
  );
}
