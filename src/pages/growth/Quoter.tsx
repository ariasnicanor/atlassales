import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Copy, Save, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { QuoteStatusBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { useScopedData } from "@/hooks/useScopedData";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { copyToClipboard } from "@/lib/contact";
import { fmtDate } from "@/lib/date";
import type { QuoteStatus } from "@/types";

function QuoterInner() {
  const [params] = useSearchParams();
  const { products, company, createQuote, updateQuote, addInteraction } = useData();
  const { leads, quotes } = useScopedData(); // solo los leads/cotizaciones del vendedor
  const { currentUser } = useSession();
  const { toast } = useToast();

  const initialProduct = products.find((p) => p.id === params.get("product")) ?? products[0];
  const [leadId, setLeadId] = useState(params.get("lead") ?? "");
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [listPrice, setListPrice] = useState(initialProduct?.list_price ?? 0);
  const [discount, setDiscount] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [tradeIn, setTradeIn] = useState(0);
  const [financing, setFinancing] = useState("");

  const finalPrice = useMemo(
    () => Math.max(0, listPrice - discount + expenses - tradeIn),
    [listPrice, discount, expenses, tradeIn]
  );

  const onProduct = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setListPrice(p.list_price);
  };

  const productName = products.find((p) => p.id === productId)?.name ?? "Producto";
  const leadName = leads.find((l) => l.id === leadId)?.name ?? "Cliente";

  const waText = `📋 Cotización ${company.name}
Cliente: ${leadName}
Producto: ${productName}
Precio lista: ${formatCurrency(listPrice)}
${discount ? `Bonificación: -${formatCurrency(discount)}\n` : ""}${expenses ? `Gastos: ${formatCurrency(expenses)}\n` : ""}${tradeIn ? `Usado a cuenta: -${formatCurrency(tradeIn)}\n` : ""}💰 Precio final: ${formatCurrency(finalPrice)}
${financing ? `Financiación: ${financing}` : ""}`;

  const save = (status: QuoteStatus) => {
    createQuote({
      lead_id: leadId || null,
      product_id: productId || null,
      user_id: currentUser?.id ?? "user_v1",
      list_price: listPrice,
      discount,
      expenses,
      trade_in_value: tradeIn,
      final_price: finalPrice,
      financing_summary: financing || null,
      status,
    });
    if (leadId) {
      addInteraction({
        lead_id: leadId,
        user_id: currentUser?.id ?? "user_v1",
        type: "cotizacion",
        note: `Cotización ${status === "borrador" ? "guardada" : "enviada"} · ${productName} · ${formatCurrency(finalPrice)}${tradeIn ? ` (recibe usado por ${formatCurrency(tradeIn)})` : ""}`,
      });
    }
    toast(status === "borrador" ? "Cotización guardada" : "Cotización marcada como enviada");
  };

  // Registrar aceptación/rechazo en el seguimiento del lead
  const decide = (q: (typeof quotes)[number], status: "aceptada" | "rechazada") => {
    updateQuote(q.id, { status });
    if (q.lead_id) {
      addInteraction({
        lead_id: q.lead_id,
        user_id: currentUser?.id ?? "user_v1",
        type: "cotizacion",
        note: `Cotización ${status === "aceptada" ? "ACEPTADA ✅" : "rechazada ❌"} · ${formatCurrency(q.final_price)}`,
      });
    }
    toast(status === "aceptada" ? "Cotización aceptada" : "Cotización rechazada");
  };

  const recentQuotes = quotes.slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> Nueva cotización</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lead / Cliente">
              <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                <option value="">Seleccionar</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Producto">
              <Select value={productId} onChange={(e) => onProduct(e.target.value)}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio de lista"><Input type="number" value={listPrice} onChange={(e) => setListPrice(Number(e.target.value))} /></Field>
            <Field label="Bonificación"><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
            <Field label="Gastos"><Input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} /></Field>
          </div>
          <Field label="Entrega un usado (valor)" hint="Se descuenta del precio final">
            <Input type="number" value={tradeIn} onChange={(e) => setTradeIn(Number(e.target.value))} />
          </Field>

          <Field label="Financiación (texto)" hint="Ej: Anticipo 40% + 12 cuotas fijas">
            <Textarea value={financing} onChange={(e) => setFinancing(e.target.value)} className="min-h-[60px]" />
          </Field>

          <div className="space-y-1 rounded-xl bg-primary/10 p-4">
            {tradeIn > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Usado a cuenta</span>
                <span>-{formatCurrency(tradeIn)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precio final</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(finalPrice)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save("borrador")} variant="outline"><Save className="size-4" /> Guardar borrador</Button>
            <Button onClick={() => save("enviada")}><Plus className="size-4" /> Crear y marcar enviada</Button>
            <Button variant="success" onClick={async () => { (await copyToClipboard(waText)) && toast("Texto copiado para WhatsApp"); }}>
              <Copy className="size-4" /> Copiar para WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Cotizaciones recientes</CardTitle></CardHeader>
        <CardContent>
          {recentQuotes.length === 0 ? (
            <EmptyState icon={FileText} title="Sin cotizaciones" />
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((q) => {
                const lead = leads.find((l) => l.id === q.lead_id);
                const prod = products.find((p) => p.id === q.product_id);
                return (
                  <div key={q.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{lead?.name ?? "Cliente"}</p>
                      <QuoteStatusBadge status={q.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{prod?.name ?? "—"} · {fmtDate(q.created_at)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(q.final_price)}</span>
                      {q.status === "enviada" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => decide(q, "aceptada")}>Aceptar</Button>
                          <Button size="sm" variant="ghost" onClick={() => decide(q, "rechazada")}>Rechazar</Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Quoter() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizador"
        description="Armá cotizaciones claras y copialas para WhatsApp en segundos."
        badge={<Badge variant="secondary">Growth</Badge>}
      />
      <UpgradeGate tier="growth" preview={<div className="grid gap-6 lg:grid-cols-5"><Card className="h-80 lg:col-span-3" /><Card className="h-80 lg:col-span-2" /></div>}>
        <QuoterInner />
      </UpgradeGate>
    </div>
  );
}
