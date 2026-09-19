import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Package, Gauge, Calendar, Fuel, SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSession } from "@/context/session";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { ProductStatusBadge } from "@/components/commercial/StatusBadges";
import { ProductImage } from "@/components/commercial/ProductImage";
import { EmptyState } from "@/components/commercial/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { productSchema, type ProductFormValues } from "@/lib/validators";

const FUELS = ["Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"];
const TRANSMISSIONS = ["Manual", "Automática", "CVT"];

export default function Stock() {
  const { products, createProduct, saleConfirmations, resolveSaleConfirmation } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("todas");
  const [category, setCategory] = useState("todas");
  const [condition, setCondition] = useState("todas");
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const conditionLabel = condition === "nuevo" ? "0 km" : condition === "usado" ? "Usados" : "";
  const activeCount =
    (brand !== "todas" ? 1 : 0) + (category !== "todas" ? 1 : 0) + (condition !== "todas" ? 1 : 0);
  const clearFilters = () => { setBrand("todas"); setCategory("todas"); setCondition("todas"); };

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { status: "disponible", condition: "nuevo", availability: 1, list_price: 0 },
  });
  const watchCondition = watch("condition");
  const { currentUser } = useSession();
  const canCreate = can(currentUser, "create", "stock");
  const canApprove = can(currentUser, "approve", "stock");
  const pendingSales = saleConfirmations.filter((r) => r.status === "pendiente");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (brand !== "todas" && p.brand !== brand) return false;
      if (category !== "todas" && p.category !== category) return false;
      if (condition !== "todas" && p.condition !== condition) return false;
      if (q && !`${p.name} ${p.brand} ${p.category} ${p.version ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, brand, category, condition]);

  const onSubmit = (values: ProductFormValues) => {
    const { images_text, ...rest } = values;
    const gallery = parseImageList([values.image_url ?? "", images_text ?? ""].join("\n"));
    createProduct({
      ...rest,
      promo_price: values.promo_price || null,
      year: values.year || null,
      mileage_km: values.mileage_km || null,
      fuel: values.fuel || null,
      transmission: values.transmission || null,
      version: values.version || null,
      description: values.description || null,
      internal_notes: values.internal_notes || null,
      images: values.image_url ? [values.image_url] : [],
      image_url: values.image_url || null,
    });
    toast("Producto creado");
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock / Productos"
        description="Disponibilidad e info comercial con fotos, para mostrar al cliente al instante."
        actions={canCreate ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Nuevo producto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Nombre" required error={errors.name?.message}><Input {...register("name")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Marca"><Input {...register("brand")} /></Field>
                  <Field label="Categoría" required error={errors.category?.message}><Input {...register("category")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Condición">
                    <Select {...register("condition")}>
                      <option value="nuevo">0 km</option>
                      <option value="usado">Usado</option>
                    </Select>
                  </Field>
                  <Field label="Versión" hint="Ej: Exclusive 1.6 CVT"><Input {...register("version")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Año"><Input type="number" {...register("year")} /></Field>
                  <Field label="Combustible">
                    <Select {...register("fuel")}>
                      <option value="">—</option>
                      {FUELS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </Select>
                  </Field>
                  <Field label="Transmisión">
                    <Select {...register("transmission")}>
                      <option value="">—</option>
                      {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                </div>
                {watchCondition === "usado" && (
                  <Field label="Kilómetros" error={errors.mileage_km?.message}><Input type="number" {...register("mileage_km")} /></Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Precio de lista" required error={errors.list_price?.message}><Input type="number" {...register("list_price")} /></Field>
                  <Field label="Precio promo"><Input type="number" {...register("promo_price")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Disponibilidad (u.)" error={errors.availability?.message}><Input type="number" {...register("availability")} /></Field>
                  <Field label="Estado">
                    <Select {...register("status")}>
                      <option value="disponible">Disponible</option>
                      <option value="reservado">Reservado</option>
                      <option value="vendido">Vendido</option>
                      <option value="sin_stock">Sin stock</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Foto (URL)" hint="Pegá el link de una imagen"><Input {...register("image_url")} placeholder="https://..." /></Field>
                <Field label="Descripción comercial"><Textarea {...register("description")} /></Field>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit">Crear producto</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      />

      {/* Búsqueda + filtros en popup (igual que Leads) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeCount > 0 && <Badge variant="default" className="ml-1">{activeCount}</Badge>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Filtros</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Field label="Condición">
                <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="todas">Nuevos y usados</option>
                  <option value="nuevo">0 km</option>
                  <option value="usado">Usados</option>
                </Select>
              </Field>
              <Field label="Marca">
                <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="todas">Todas las marcas</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Categoría">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="todas">Todas las categorías</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
              <DialogClose asChild><Button>Ver {filtered.length} resultados</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {canApprove && pendingSales.length > 0 && (
        <Card className="border-warning/50">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Ventas a confirmar ({pendingSales.length})</p>
            {pendingSales.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.lead_name} · cerrada por {r.requested_by_name}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    resolveSaleConfirmation(r.id, "confirmada");
                    toast("Venta confirmada · unidad marcada como vendida");
                  }}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    resolveSaleConfirmation(r.id, "rechazada");
                    toast("Venta rechazada");
                  }}
                >
                  Rechazar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {condition !== "todas" && <Chip label={conditionLabel} onClear={() => setCondition("todas")} />}
          {brand !== "todas" && <Chip label={brand} onClear={() => setBrand("todas")} />}
          {category !== "todas" && <Chip label={category} onClear={() => setCategory("todas")} />}
          <button onClick={clearFilters} className="text-xs text-muted-foreground underline">Limpiar todo</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No hay productos" description="Ajustá los filtros o cargá un producto nuevo." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const isVehicle = ["Pickups", "SUV", "Autos", "Utilitarios"].includes(p.category) || Boolean(p.year);
            return (
              <Link key={p.id} to={`/stock/${p.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  {/* Foto con badges superpuestos */}
                  <div className="relative">
                    <ProductImage src={p.image_url ?? p.images[0]} alt={p.name} className="h-44 w-full" />
                    <div className="absolute left-2 top-2">
                      <Badge variant={p.condition === "nuevo" ? "default" : "secondary"}>
                        {p.condition === "nuevo" ? "0 km" : "Usado"}
                      </Badge>
                    </div>
                    <div className="absolute right-2 top-2">
                      <ProductStatusBadge status={p.status} />
                    </div>
                  </div>

                  <CardContent className="space-y-2 p-4">
                    <div>
                      <p className="truncate font-medium leading-tight">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.version ?? `${p.brand} · ${p.category}`}</p>
                    </div>

                    {/* Detalles rápidos (vehículos) */}
                    {isVehicle && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {p.year && <span className="flex items-center gap-1"><Calendar className="size-3.5" /> {p.year}</span>}
                        {p.condition === "usado" && p.mileage_km != null && (
                          <span className="flex items-center gap-1"><Gauge className="size-3.5" /> {p.mileage_km.toLocaleString("es-AR")} km</span>
                        )}
                        {p.fuel && <span className="flex items-center gap-1"><Fuel className="size-3.5" /> {p.fuel}</span>}
                      </div>
                    )}

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        {p.promo_price ? (
                          <>
                            <p className="text-xs text-muted-foreground line-through">{formatCurrency(p.list_price)}</p>
                            <p className="text-lg font-semibold text-success">{formatCurrency(p.promo_price)}</p>
                          </>
                        ) : (
                          <p className="text-lg font-semibold">{formatCurrency(p.list_price)}</p>
                        )}
                      </div>
                      <Badge variant="muted">{p.availability} u.</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-background/50" aria-label="Quitar filtro">
        <X className="size-3" />
      </button>
    </Badge>
  );
}
