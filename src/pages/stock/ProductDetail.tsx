import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calculator, FileText, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { ProductStatusBadge } from "@/components/commercial/StatusBadges";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { ProductStatus } from "@/types";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, leads, updateProduct } = useData();
  const { toast } = useToast();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <EmptyState icon={Package} title="Producto no encontrado" action={<Button asChild><Link to="/stock">Volver</Link></Button>} />
    );
  }

  const interested = leads.filter((l) => l.product_interest === product.name && !["ganado", "perdido"].includes(l.status));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/stock"><ArrowLeft className="size-4" /> Volver a stock</Link>
      </Button>

      <PageHeader
        title={product.name}
        description={`${product.brand} · ${product.category}`}
        badge={<ProductStatusBadge status={product.status} />}
        actions={
          <Button asChild><Link to={`/growth/quoter?product=${product.id}`}><FileText className="size-4" /> Cotizar</Link></Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Información comercial</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Precio de lista</p>
                <p className="text-2xl font-semibold">{formatCurrency(product.list_price)}</p>
              </div>
              {product.promo_price && (
                <div>
                  <p className="text-xs text-muted-foreground">Precio promocional</p>
                  <p className="text-2xl font-semibold text-success">{formatCurrency(product.promo_price)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Disponibilidad</p>
                <p className="text-2xl font-semibold">{product.availability} u.</p>
              </div>
            </div>

            {product.description && (
              <div>
                <p className="mb-1 text-sm font-medium">Descripción</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
            {product.internal_notes && (
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium"><Tag className="size-3.5" /> Notas internas</p>
                <p className="text-sm text-muted-foreground">{product.internal_notes}</p>
              </div>
            )}

            <Field label="Cambiar estado" className="max-w-xs">
              <Select
                value={product.status}
                onChange={(e) => {
                  updateProduct(product.id, { status: e.target.value as ProductStatus });
                  toast("Estado actualizado");
                }}
              >
                <option value="disponible">Disponible</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
                <option value="sin_stock">Sin stock</option>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads interesados ({interested.length})</CardTitle></CardHeader>
          <CardContent>
            {interested.length === 0 ? (
              <EmptyState icon={Calculator} title="Sin leads interesados" description="Asociá este producto a un lead desde su ficha." />
            ) : (
              <div className="space-y-2">
                {interested.map((l) => (
                  <Link key={l.id} to={`/leads/${l.id}`} className="block rounded-lg border p-3 text-sm transition-colors hover:bg-accent">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.source}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
