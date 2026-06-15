import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { leadSchema, type LeadFormValues } from "@/lib/validators";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from "@/lib/labels";

const SOURCES = ["Web", "WhatsApp", "Referido", "Instagram", "Showroom", "Campaña Meta", "Llamada entrante", "Mercado Libre"];

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { leads, users, products, createLead, updateLead } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();

  const editing = Boolean(id);
  const lead = leads.find((l) => l.id === id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      source: "Web",
      status: "nuevo",
      temperature: "tibio",
      product_interest: "",
      assigned_user_id: currentUser?.id ?? "",
      next_contact_at: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead) {
      reset({
        name: lead.name,
        phone: lead.phone ?? "",
        email: lead.email ?? "",
        source: lead.source,
        status: lead.status,
        temperature: lead.temperature,
        product_interest: lead.product_interest ?? "",
        assigned_user_id: lead.assigned_user_id ?? "",
        next_contact_at: lead.next_contact_at ? lead.next_contact_at.slice(0, 10) : "",
        notes: lead.notes ?? "",
      });
    }
  }, [lead, reset]);

  const onSubmit = (values: LeadFormValues) => {
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      product_interest: values.product_interest || null,
      assigned_user_id: values.assigned_user_id || null,
      notes: values.notes || null,
      next_contact_at: values.next_contact_at
        ? new Date(values.next_contact_at).toISOString()
        : null,
    };

    if (editing && lead) {
      updateLead(lead.id, payload);
      toast("Lead actualizado");
      navigate(`/leads/${lead.id}`);
    } else {
      const created = createLead(payload);
      toast("Lead creado 🎉");
      navigate(`/leads/${created.id}`);
    }
  };

  const sellers = users.filter((u) => u.role === "vendedor" || u.role === "supervisor");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to={editing && lead ? `/leads/${lead.id}` : "/leads"}>
          <ArrowLeft className="size-4" /> Volver
        </Link>
      </Button>

      <PageHeader
        title={editing ? "Editar lead" : "Nuevo lead"}
        description={editing ? "Actualizá los datos del lead." : "Cargá un lead en segundos. Solo el nombre es obligatorio."}
      />

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nombre" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" placeholder="Ej: Marcelo Giménez" {...register("name")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" placeholder="+54 9 ..." {...register("phone")} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input id="email" type="email" placeholder="email@mail.com" {...register("email")} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Origen" htmlFor="source" error={errors.source?.message}>
                <Select id="source" {...register("source")}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Producto de interés" htmlFor="product_interest">
                <Select id="product_interest" {...register("product_interest")}>
                  <option value="">Sin definir</option>
                  {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Estado" htmlFor="status">
                <Select id="status" {...register("status")}>
                  {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                </Select>
              </Field>
              <Field label="Temperatura" htmlFor="temperature">
                <Select id="temperature" {...register("temperature")}>
                  <option value="frio">🧊 Frío</option>
                  <option value="tibio">🌤️ Tibio</option>
                  <option value="caliente">🔥 Caliente</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vendedor asignado" htmlFor="assigned_user_id">
                <Select id="assigned_user_id" {...register("assigned_user_id")}>
                  <option value="">Sin asignar</option>
                  {sellers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </Field>
              <Field label="Próximo contacto" htmlFor="next_contact_at">
                <Input id="next_contact_at" type="date" {...register("next_contact_at")} />
              </Field>
            </div>

            <Field label="Observaciones" htmlFor="notes">
              <Textarea id="notes" placeholder="Notas internas, contexto, etc." {...register("notes")} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="size-4" /> {editing ? "Guardar cambios" : "Crear lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
