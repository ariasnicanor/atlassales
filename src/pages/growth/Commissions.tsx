import { useMemo, useState } from "react";
import { Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { StatCard } from "@/components/commercial/StatCard";
import { useData } from "@/data/store";
import { formatCurrency } from "@/lib/utils";

function CommissionsInner() {
  const { users, sales } = useData();
  const sellers = users.filter((u) => u.role === "vendedor");
  const [rates, setRates] = useState<Record<string, number>>(
    Object.fromEntries(sellers.map((s) => [s.id, 2]))
  );

  const rows = useMemo(
    () =>
      sellers.map((s) => {
        const sellerSales = sales.filter((x) => x.user_id === s.id);
        const total = sellerSales.reduce((acc, x) => acc + x.amount, 0);
        const rate = rates[s.id] ?? 2;
        return { seller: s, count: sellerSales.length, total, commission: Math.round((total * rate) / 100), rate };
      }),
    [sellers, sales, rates]
  );

  const totalCommission = rows.reduce((acc, r) => acc + r.commission, 0);
  const totalSold = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Vendido (período)" value={formatCurrency(totalSold)} icon={Percent} tone="brand" />
        <StatCard label="Comisiones totales" value={formatCurrency(totalCommission)} icon={Percent} tone="success" />
        <StatCard label="Ventas" value={rows.reduce((a, r) => a + r.count, 0)} icon={Percent} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Total vendido</TableHead>
                <TableHead>Comisión %</TableHead>
                <TableHead className="text-right">Comisión estimada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.seller.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.seller.name} size="sm" />
                      <span className="font-medium">{r.seller.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="muted">{r.count}</Badge></TableCell>
                  <TableCell>{formatCurrency(r.total)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.rate}
                      onChange={(e) => setRates((p) => ({ ...p, [r.seller.id]: Number(e.target.value) }))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">{formatCurrency(r.commission)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Commissions() {
  return (
    <div className="space-y-6">
      <PageHeader title="Comisiones" description="Configurá comisiones por vendedor y calculá el estimado del período." badge={<Badge variant="secondary">Growth</Badge>} />
      <UpgradeGate tier="growth" preview={<Card className="h-72" />}><CommissionsInner /></UpgradeGate>
    </div>
  );
}
