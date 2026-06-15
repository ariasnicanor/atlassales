import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Contact, Building2, MapPin, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Field } from "@/components/forms/Field";
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
import { clientSchema, type ClientFormValues } from "@/lib/validators";

export default function Clients() {
  const { clients, leads, createClient } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) =>
      `${c.name} ${c.email ?? ""} ${c.company_name ?? ""} ${c.city ?? ""}`.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const leadsByClient = (clientId: string) => leads.filter((l) => l.client_id === clientId).length;

  const onSubmit = (values: ClientFormValues) => {
    createClient({
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      company_name: values.company_name || null,
      city: values.city || null,
      notes: values.notes || null,
    });
    toast("Cliente creado");
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="La base comercial de tu empresa. Centralizá la información de cada cliente."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Nuevo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Nombre" required error={errors.name?.message}>
                  <Input placeholder="Nombre y apellido" {...register("name")} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Teléfono"><Input {...register("phone")} /></Field>
                  <Field label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Empresa"><Input {...register("company_name")} /></Field>
                  <Field label="Ciudad"><Input {...register("city")} /></Field>
                </div>
                <Field label="Observaciones"><Textarea {...register("notes")} /></Field>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit">Crear cliente</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Contact} title="No hay clientes" description="Creá tu primer cliente para empezar." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} to={`/clients/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      {c.company_name && (
                        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                          <Building2 className="size-3.5" /> {c.company_name}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {c.city ?? "—"}</span>
                    <span>{leadsByClient(c.id)} leads</span>
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
