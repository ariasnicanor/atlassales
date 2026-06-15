import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Package } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { ProductStatusBadge } from "@/components/commercial/StatusBadges";
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

export default function Stock() {
  const { products, createProduct } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("todas");
  const [category, setCategory] = useState("todas");
  const [avail, setAvail] = useState("todas");
  const [open, setOpen] = useState(false);

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { status: "disponible", availability: 1, list_price: 0 },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (brand !== "todas" && p.brand !== brand) return false;
      if (category !== "todas" && p.category !== category) return false;
      if (avail === "disponibles" && p.status !== "disponible") return false;
      if (avail === "sin_stock" && p.status !== "sin_stock") return false;
      if (q && !`${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, brand, category, avail]);

  const onSubmit = (values: ProductFormValues) => {
    createProduct({
      ...values,
      promo_price: values.promo_price || null,
      description: values.description || null,
      internal_notes: values.internal_notes || null,
    });
    toast("Producto creado");
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock / Productos"
        description="Disponibilidad e información comercial al alcance del vendedor."
        actions={
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
                <Field label="Descripción comercial"><Textarea {...register("description")} /></Field>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit">Crear producto</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="todas">Todas las marcas</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={avail} onChange={(e) => setAvail(e.target.value)}>
          <option value="todas">Toda disponibilidad</option>
          <option value="disponibles">Solo disponibles</option>
          <option value="sin_stock">Sin stock</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No hay productos" description="Ajustá los filtros o cargá un producto nuevo." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/stock/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.brand} · {p.category}</p>
                    </div>
                    <ProductStatusBadge status={p.status} />
                  </div>
                  <div className="flex items-end justify-between">
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
          ))}
        </div>
      )}
    </div>
  );
}
