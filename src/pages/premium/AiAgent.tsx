import { Bot, MessageSquare, ClipboardCheck, CalendarClock, UserCheck, ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useToast } from "@/components/ui/toast";

function AiAgentInner() {
  const { toast } = useToast();

  const chat = [
    { from: "agent", text: "¡Hola! 👋 Soy el asistente de ventas. ¿Qué producto estás buscando?" },
    { from: "lead", text: "Hola, me interesa una pickup 4x4." },
    { from: "agent", text: "¡Genial! ¿La usarías para trabajo o uso particular? ¿Tenés un presupuesto en mente?" },
    { from: "lead", text: "Para el campo. Hasta 55 millones, y la necesito este mes." },
    { from: "agent", text: "Perfecto. Te recomiendo la Hilux SRV 4x4. ¿Te paso una cotización y coordino con un vendedor?" },
    { from: "lead", text: "Sí, dale. Soy Marcelo, 266-555123." },
  ];

  const steps = [
    { icon: MessageSquare, t: "Primer contacto automático", d: "El agente saluda y entiende la necesidad." },
    { icon: ClipboardCheck, t: "Calificación", d: "Presupuesto, urgencia, producto y datos de contacto." },
    { icon: CalendarClock, t: "Agenda", d: "Propone horarios y reserva la reunión." },
    { icon: UserCheck, t: "Derivación inteligente", d: "Asigna el lead calificado al vendedor con un resumen." },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Card key={s.t}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon className="size-5" /></div>
                <Badge variant="muted">Paso {i + 1}</Badge>
              </div>
              <p className="font-medium">{s.t}</p>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="size-5 text-primary" /> Conversación del agente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.from === "lead" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.from === "lead" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="size-5 text-primary" /> Lead calificado para derivar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name="Marcelo G" />
              <div><p className="font-medium">Marcelo (266-555123)</p><p className="text-sm text-muted-foreground">Pickup 4x4 · Campo</p></div>
            </div>
            <div className="space-y-2 text-sm">
              {["Presupuesto: hasta $55M", "Urgencia: este mes", "Producto: Hilux SRV 4x4", "Necesidad: uso en el campo"].map((x) => (
                <div key={x} className="flex items-center gap-2"><Check className="size-4 text-success" /> {x}</div>
              ))}
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-sm">
              <p className="font-medium text-primary">Próxima acción recomendada</p>
              <p className="text-muted-foreground">Llamar hoy, ofrecer cotización con financiación y coordinar visita.</p>
            </div>
            <Button className="w-full" onClick={() => toast("Lead derivado al vendedor (demo)")}>
              Derivar a un vendedor <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AiAgent() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Agent Package" description="Un agente que califica y te entrega oportunidades listas para cerrar." badge={<Badge variant="secondary">Enterprise</Badge>} />
      <UpgradeGate tier="ai_agent" preview={<Card className="h-72" />}><AiAgentInner /></UpgradeGate>
    </div>
  );
}
