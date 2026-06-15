import { useState } from "react";
import { useForm } from "react-hook-form";
import { MessageSquareText, Copy, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/forms/Field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { UpgradeGate } from "@/components/commercial/UpgradeGate";
import { useData } from "@/data/store";
import { useToast } from "@/components/ui/toast";
import { copyToClipboard } from "@/lib/contact";
import { TEMPLATE_CATEGORY_LABEL } from "@/lib/labels";
import type { TemplateCategory } from "@/types";

interface FormVals {
  title: string;
  category: TemplateCategory;
  body: string;
}

function TemplatesInner() {
  const { templates, createTemplate, deleteTemplate } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormVals>({
    defaultValues: { category: "seguimiento", title: "", body: "" },
  });

  const onSubmit = (v: FormVals) => {
    createTemplate(v);
    toast("Plantilla creada");
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> Nueva plantilla</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva plantilla</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label="Título"><Input {...register("title")} placeholder="Ej: Seguimiento post-visita" /></Field>
              <Field label="Categoría">
                <Select {...register("category")}>
                  {Object.entries(TEMPLATE_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Mensaje" hint="Usá {{nombre}}, {{producto}}, {{precio}} como variables">
                <Textarea {...register("body")} className="min-h-[120px]" />
              </Field>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Crear</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <Badge variant="secondary" className="mt-1">{TEMPLATE_CATEGORY_LABEL[t.category]}</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { deleteTemplate(t.id); toast("Plantilla eliminada"); }} aria-label="Eliminar">
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{t.body}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={async () => { (await copyToClipboard(t.body)) && toast("Copiado para WhatsApp"); }}>
                <Copy className="size-4" /> Copiar para WhatsApp
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Templates() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plantillas comerciales" description="Respuestas listas para enviar. Menos tipeo, más velocidad." badge={<Badge variant="secondary">Growth</Badge>} />
      <UpgradeGate tier="growth" preview={<Card className="h-72" />}><TemplatesInner /></UpgradeGate>
    </div>
  );
}
