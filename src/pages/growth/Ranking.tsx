import { useMemo } from "react";
import { Trophy, Medal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { formatCurrency, formatPercent } from "@/lib/utils";

function RankingInner() {
  const { users, leads, quotes, tasks, sales } = useData();
  const sellers = users.filter((u) => u.role === "vendedor");

  const ranked = useMemo(() => {
    return sellers
      .map((s) => {
        const sellerLeads = leads.filter((l) => l.assigned_user_id === s.id);
        const won = sellerLeads.filter((l) => l.status === "ganado").length;
        const lost = sellerLeads.filter((l) => l.status === "perdido").length;
        const sellerSales = sales.filter((x) => x.user_id === s.id);
        const sold = sellerSales.reduce((a, x) => a + x.amount, 0);
        const conversion = won + lost > 0 ? won / (won + lost) : 0;
        return {
          seller: s,
          leads: sellerLeads.length,
          quotes: quotes.filter((q) => q.user_id === s.id).length,
          tasks: tasks.filter((t) => t.assigned_user_id === s.id && t.status === "completada").length,
          won,
          sold,
          conversion,
        };
      })
      .sort((a, b) => b.sold - a.sold || b.won - a.won);
  }, [sellers, leads, quotes, tasks, sales]);

  const medal = (i: number) => ["text-amber-500", "text-zinc-400", "text-orange-600"][i];

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Ventas</TableHead>
              <TableHead>Vendido</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Cotiz.</TableHead>
              <TableHead>Tareas</TableHead>
              <TableHead className="text-right">Conversión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((r, i) => (
              <TableRow key={r.seller.id}>
                <TableCell>
                  {i < 3 ? <Medal className={`size-5 ${medal(i)}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.seller.name} size="sm" />
                    <span className="font-medium">{r.seller.name}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="success">{r.won}</Badge></TableCell>
                <TableCell className="font-medium">{formatCurrency(r.sold)}</TableCell>
                <TableCell>{r.leads}</TableCell>
                <TableCell>{r.quotes}</TableCell>
                <TableCell>{r.tasks}</TableCell>
                <TableCell className="text-right">{formatPercent(r.conversion)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Ranking() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ranking de vendedores" description="Sana competencia: quién está cerrando más y mejor." badge={<Badge variant="secondary">Growth</Badge>} />
      <UpgradeGate tier="growth" preview={<Card className="h-72" />}><RankingInner /></UpgradeGate>
    </div>
  );
}
