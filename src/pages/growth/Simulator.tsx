import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calculator, Save, Copy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { useScopedData } from "@/hooks/useScopedData";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { copyToClipboard } from "@/lib/contact";

function SimulatorInner() {
  const [params] = useSearchParams();
  const { products, createSimulation, addInteraction } = useData();
  const { leads } = useScopedData(); // solo los leads del vendedor
  const { currentUser } = useSession();
  const { toast } = useToast();

  const initialProduct = products.find((p) => p.id === params.get("product")) ?? products[0];
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [price, setPrice] = useState(initialProduct?.promo_price ?? initialProduct?.list_price ?? 0);
  const [downPct, setDownPct] = useState(40);
  const [tradeIn, setTradeIn] = useState(0);
  const [term, setTerm] = useState(24);
  const [rate, setRate] = useState(45);
  const [leadId, setLeadId] = useState(params.get("lead") ?? "");

  const calc = useMemo(() => {
    const cashDown = Math.round((price * downPct) / 100);
    const totalDown = Math.min(price, cashDown + tradeIn);
    const financed = Math.max(0, price - totalDown);
    const tradeInPct = price > 0 ? tradeIn / price : 0;
    const totalDownPct = price > 0 ? totalDown / price : 0;
    const monthlyRate = rate / 100 / 12;
    const payment =
      financed === 0
        ? 0
        : monthlyRate === 0
        ? financed / term
        : (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    const totalFinanced = payment * term;
    const totalInterest = totalFinanced - financed;
    const totalCost = totalDown + totalFinanced;
    return {
      cashDown,
      down: totalDown,
      tradeInPct,
      totalDownPct,
      financed,
      payment: Math.round(payment),
      totalFinanced: Math.round(totalFinanced),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(totalCost),
    };
  }, [price, downPct, tradeIn, term, rate]);

  const onProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setPrice(p.promo_price ?? p.list_price);
  };

  const productName = products.find((p) => p.id === productId)?.name ?? "";

  const save = () => {
    createSimulation({
      lead_id: leadId || null,
      product_id: productId || null,
      price,
      trade_in_value: tradeIn,
      down_payment: calc.down,
      financed_amount: calc.financed,
      term_months: term,
      rate: rate / 100,
      estimated_payment: calc.payment,
    });
    if (leadId) {
      addInteraction({
        lead_id: leadId,
        user_id: currentUser?.id ?? "user_v1",
        type: "nota",
        note: `Simulación ${productName} · ${term} cuotas de ${formatCurrency(calc.payment)}${tradeIn ? ` (entrega usado por ${formatCurrency(tradeIn)})` : ""}`,
      });
    }
    toast("Simulación guardada" + (leadId ? " en el lead" : ""));
  };

  const summaryText = `Simulación ${productName}:
Precio: ${formatCurrency(price)}
${tradeIn ? `Usado a cuenta (${formatPercent(calc.tradeInPct)}): ${formatCurrency(tradeIn)}\n` : ""}Anticipo total (${formatPercent(calc.totalDownPct)}): ${formatCurrency(calc.down)}
A financiar: ${formatCurrency(calc.financed)}
${term} cuotas de ${formatCurrency(calc.payment)}
Tasa: ${rate}% anual`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="size-5 text-primary" /> Datos de la operación</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Producto">
            <Select value={productId} onChange={(e) => onProduct(e.target.value)}>
              <option value="">Producto manual</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Precio">
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Anticipo en efectivo (${downPct}%)`}>
              <Input type="range" min={0} max={90} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} />
            </Field>
            <Field label="Plazo (meses)">
              <Select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                {[6, 12, 18, 24, 36, 48, 60].map((t) => <option key={t} value={t}>{t} meses</option>)}
              </Select>
            </Field>
          </div>
          <Field
            label="Entrega un usado (valor)"
            hint={tradeIn > 0 ? `El usado representa ${formatPercent(calc.tradeInPct)} del precio · Anticipo total ${formatPercent(calc.totalDownPct)}` : "Cuenta como parte del anticipo"}
          >
            <Input type="number" value={tradeIn} onChange={(e) => setTradeIn(Number(e.target.value))} />
          </Field>
          <Field label={`Tasa anual (${rate}%)`}>
            <Input type="range" min={0} max={120} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </Field>
          <Field label="Guardar en lead (opcional)">
            <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Sin asociar</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-primary/10 p-5 text-center">
            <p className="text-sm text-muted-foreground">Cuota estimada</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(calc.payment)}</p>
            <p className="text-sm text-muted-foreground">{term} cuotas fijas</p>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Anticipo en efectivo" value={formatCurrency(calc.cashDown)} />
            {tradeIn > 0 && (
              <Row label={`Usado a cuenta (${formatPercent(calc.tradeInPct)})`} value={formatCurrency(tradeIn)} />
            )}
            <Row label={`Anticipo total (${formatPercent(calc.totalDownPct)})`} value={formatCurrency(calc.down)} />
            <Row label="Monto a financiar" value={formatCurrency(calc.financed)} />
            <Row label="Total financiado" value={formatCurrency(calc.totalFinanced)} />
            <Row label="Intereses" value={formatCurrency(calc.totalInterest)} />
            <Row label="Costo total" value={formatCurrency(calc.totalCost)} strong />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={save} className="flex-1"><Save className="size-4" /> Guardar simulación</Button>
            <Button variant="outline" className="flex-1" onClick={async () => { (await copyToClipboard(summaryText)) && toast("Copiado para WhatsApp"); }}>
              <Copy className="size-4" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-base font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

export default function Simulator() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulador financiero"
        description="Calculá cuotas al instante y guardalas en el lead."
        badge={<Badge variant="secondary">Growth</Badge>}
      />
      <UpgradeGate
        tier="growth"
        preview={
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-64" /><Card className="h-64" />
          </div>
        }
      >
        <SimulatorInner />
      </UpgradeGate>
    </div>
  );
}
