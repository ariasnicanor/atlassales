import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  FileText,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Boxes,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/Field";
import { ProductStatusBadge } from "@/components/commercial/StatusBadges";
import { ProductImage } from "@/components/commercial/ProductImage";
import { EmptyState } from "@/components/commercial/EmptyState";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { ProductStatus } from "@/types";

export default function ProductDetail() {
  const { id } = useParams();
  const { products, leads, updateProduct } = useData();
  const { toast } = useToast();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <EmptyState icon={Package} title="Producto no encontrado" action={<Button asChild><Link to="/stock">Volver</Link></Button>} />
    );
  }

  const interested = leads.filter((l) => l.product_interest === product.name && !["vendido", "cerrado"].includes(l.status));

  // Grilla de datos: para vehículos muestra Año/Km/Combustible/Transmisión.
  const details: { icon: LucideIcon; label: string; value: string }[] = [];
  if (product.year) details.push({ icon: Calendar, label: "Año", value: String(product.year) });
  if (product.condition === "usado" && product.mileage_km != null)
    details.push({ icon: Gauge, label: "Kilómetros", value: `${product.mileage_km.toLocaleString("es-AR")} km` });
  if (product.fuel) details.push({ icon: Fuel, label: "Combustible", value: product.fuel });
  if (product.transmission) details.push({ icon: Cog, label: "Transmisión", value: product.transmission });
  // Relleno para no-vehículos
  details.push({ icon: Boxes, label: "Disponibilidad", value: `${product.availability} u.` });
  details.push({ icon: Tag, label: "Categoría", value: product.category });

  const gallery = product.images.length ? product.images : product.image_url ? [product.image_url] : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/stock"><ArrowLeft className="size-4" /> Volver a stock</Link>
      </Button>

      <PageHeader
        title={product.name}
        description={[product.version, product.year].filter(Boolean).join(" · ") || `${product.brand} · ${product.category}`}
        badge={
          <span className="flex items-center gap-1.5">
            <ProductStatusBadge status={product.status} />
            <Badge variant={product.condition === "nuevo" ? "default" : "secondary"}>
              {product.condition === "nuevo" ? "0 km" : "Usado"}
            </Badge>
          </span>
        }
        actions={
          <Button asChild><Link to={`/growth/quoter?product=${product.id}`}><FileText className="size-4" /> Cotizar</Link></Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ficha principal (estilo mockup) */}
        <Card className="overflow-hidden lg:col-span-2">
          <ProductImage src={gallery[0]} alt={product.name} className="h-64 w-full sm:h-80" />
          {gallery.length > 1 && (
            <div className="flex gap-2 p-3">
              {gallery.slice(0, 4).map((src, i) => (
                <ProductImage key={i} src={src} alt={`${product.name} ${i + 1}`} className="h-16 w-24 rounded-lg" />
              ))}
            </div>
          )}
          <CardContent className="space-y-5 p-5">
            <div>
              {product.promo_price ? (
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-success">{formatCurrency(product.promo_price)}</p>
                  <p className="pb-1 text-sm text-muted-foreground line-through">{formatCurrency(product.list_price)}</p>
                </div>
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(product.list_price)}</p>
              )}
            </div>

            {/* Grilla de detalles 2x2+ */}
            <div className="grid grid-cols-2 gap-3">
              {details.map((d) => (
                <div key={d.label} className="rounded-xl border p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <d.icon className="size-3.5" /> {d.label}
                  </p>
                  <p className="mt-0.5 font-medium">{d.value}</p>
                </div>
              ))}
            </div>

            {product.description && (
              <div>
                <p className="mb-1 text-sm font-medium">Descripción</p>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}

            <Button asChild className="w-full" size="lg">
              <Link to={`/growth/quoter?product=${product.id}`}><FileText className="size-4" /> Cotizar este producto</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Panel lateral: gestión interna + leads interesados */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Gestión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Estado">
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
              {product.internal_notes && (
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium"><Tag className="size-3.5" /> Notas internas</p>
                  <p className="text-sm text-muted-foreground">{product.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Leads interesados ({interested.length})</CardTitle></CardHeader>
            <CardContent>
              {interested.length === 0 ? (
                <EmptyState icon={Package} title="Sin leads interesados" description="Asociá este producto a un lead desde su ficha." />
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
    </div>
  );
}
