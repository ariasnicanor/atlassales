import { Check, Sparkles, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/components/ui/toast";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default function Plans() {
  const { hasTier, activatePlan, deactivatePlan } = usePlan();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planes y módulos"
        description="Empezá con el Core y escalá cuando lo necesites. Activá módulos en la demo para mostrarlos."
        badge={<Badge variant="secondary"><Sparkles className="size-3" /> Comercial</Badge>}
      />

      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent2/5 p-5">
        <p className="text-sm">
          <strong>Cómo se vende:</strong> el <strong>Core</strong> ordena al equipo; <strong>Growth</strong> acelera las
          ventas; <strong>Automation</strong> saca trabajo repetitivo; <strong>AI Assist</strong> mejora decisiones y{" "}
          <strong>AI Agent</strong> entrega oportunidades calificadas. Los precios son variables comerciales.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PLANS.map((plan) => {
          const active = hasTier(plan.tier);
          const isCore = plan.tier === "core";
          return (
            <Card
              key={plan.tier}
              className={cn(
                "relative flex flex-col",
                plan.highlight && "border-primary shadow-md",
                active && "ring-1 ring-success/40"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="shadow"><Star className="size-3" /> Más elegido</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {active && <Badge variant="success">Activo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="pt-2 text-2xl font-bold">
                  {plan.priceHint}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ a definir</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="pt-5">
                  {isCore ? (
                    <Button variant="outline" className="w-full" disabled>Incluido siempre</Button>
                  ) : active ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { deactivatePlan(plan.tier); toast(`${plan.name} desactivado`); }}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => { activatePlan(plan.tier); toast(`${plan.name} activado 🎉`); }}
                    >
                      <Sparkles className="size-4" /> Activar en la demo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Esta pantalla funciona como página comercial interna de “Upgrade”. Activá/desactivá módulos para mostrar cada plan a un cliente.
      </p>
    </div>
  );
}
