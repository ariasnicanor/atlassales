import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Wand2, Brain, ListChecks, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { TemperatureBadge } from "@/components/commercial/StatusBadges";
import { useData } from "@/data/store";

function mockSummarize(text: string) {
  const lines = text.split(/\n|\./).map((l) => l.trim()).filter(Boolean).slice(0, 3);
  return {
    resumen:
      lines.length > 0
        ? `El cliente mostró interés y mencionó: ${lines.join("; ")}.`
        : "El cliente mostró interés en avanzar con la compra y pidió más información.",
    proximaAccion: "Enviar cotización con financiación y agendar seguimiento en 48 hs.",
    objeciones: ["Precio vs. competencia", "Plazo de entrega"],
  };
}

function AiAssistInner() {
  const { aiScores, leads } = useData();
  const [conversation, setConversation] = useState("");
  const [result, setResult] = useState<ReturnType<typeof mockSummarize> | null>(null);
  const [loading, setLoading] = useState(false);

  const summarize = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(mockSummarize(conversation));
      setLoading(false);
    }, 700);
  };

  const scored = aiScores
    .map((s) => ({ score: s, lead: leads.find((l) => l.id === s.lead_id) }))
    .filter((x) => x.lead)
    .sort((a, b) => b.score.score - a.score.score);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Wand2, t: "Resumen de conversaciones" },
          { icon: Brain, t: "Clasificación de leads" },
          { icon: ListChecks, t: "Priorización" },
          { icon: Lightbulb, t: "Recomendaciones" },
        ].map((f) => (
          <Card key={f.t}><CardContent className="flex items-center gap-3 p-4"><f.icon className="size-5 text-primary" /><p className="text-sm font-medium">{f.t}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="size-5 text-primary" /> Resumen automático</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Pegá acá la conversación con el cliente..." value={conversation} onChange={(e) => setConversation(e.target.value)} className="min-h-[140px]" />
            <Button onClick={summarize} disabled={loading} className="w-full">
              <Sparkles className="size-4" /> {loading ? "Analizando..." : "Resumir con IA"}
            </Button>
            {result && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                <div><p className="font-medium text-primary">Resumen</p><p className="text-muted-foreground">{result.resumen}</p></div>
                <div><p className="font-medium text-primary">Próxima acción</p><p className="text-muted-foreground">{result.proximaAccion}</p></div>
                <div>
                  <p className="font-medium text-primary">Posibles objeciones</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">{result.objeciones.map((o) => <Badge key={o} variant="secondary">{o}</Badge>)}</div>
                </div>
                <p className="text-xs text-muted-foreground">* Demo con resultado simulado. Conectá tu proveedor de IA para producción.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-5 text-primary" /> Priorización de oportunidades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {scored.map(({ score, lead }) => (
              <Link key={score.id} to={`/leads/${lead!.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Avatar name={lead!.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{lead!.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{score.recommended_action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{score.score}</p>
                    <TemperatureBadge temperature={score.classification} />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AiAssist() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Assist Package" description="Tu copiloto comercial: mejores decisiones, más foco en lo que convierte." badge={<Badge variant="secondary">Premium</Badge>} />
      <UpgradeGate tier="ai_assist" preview={<Card className="h-72" />}><AiAssistInner /></UpgradeGate>
    </div>
  );
}
