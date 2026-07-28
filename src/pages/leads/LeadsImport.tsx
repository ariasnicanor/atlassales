import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { OPEN_PIPELINE } from "@/lib/lead-management";
import { LEAD_STATUS_LABEL } from "@/lib/labels";
import type { Lead, LeadStatus, Temperature } from "@/types";

const TEMPLATE_HEADERS = [
  "nombre",
  "telefono",
  "email",
  "origen",
  "producto_interes",
  "estado_inicial",
  "vendedor_asignado",
] as const;

type Row = Record<(typeof TEMPLATE_HEADERS)[number], string>;

interface ParsedRow {
  rowNumber: number; // fila en el excel (con header = 1)
  raw: Row;
  errors: string[];
  warnings: string[];
  duplicate: null | "phone" | "email" | "both";
  // Normalizado para importar (solo si !errors.length)
  lead: {
    name: string;
    phone: string | null;
    email: string | null;
    source: string;
    product_interest: string | null;
    status: LeadStatus;
    assigned_user_id: string | null;
    temperature: Temperature;
  } | null;
}

const VALID_STATUSES = new Set<string>(OPEN_PIPELINE);

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function statusFromLabel(input: string): LeadStatus | null {
  const v = normalize(input);
  if (!v) return "nuevo";
  // slug directo
  if (VALID_STATUSES.has(v)) return v as LeadStatus;
  // por label en español
  const found = OPEN_PIPELINE.find((s) => normalize(LEAD_STATUS_LABEL[s]) === v);
  return found ?? null;
}

export default function LeadsImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, users, createLead } = useData();
  const { currentUser } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  const role = currentUser?.role;
  const canImport = role === "admin" || role === "supervisor";

  const sellers = useMemo(
    () => users.filter((u) => u.active !== false && u.role === "vendedor"),
    [users]
  );

  const sellerLookup = useMemo(() => {
    const map = new Map<string, string>(); // key normalizado → id
    for (const u of sellers) {
      map.set(normalize(u.name), u.id);
      map.set(normalize(u.email), u.id);
      map.set(u.id, u.id);
    }
    return map;
  }, [sellers]);

  const existingPhones = useMemo(
    () => new Set(leads.map((l) => (l.phone ?? "").replace(/\D/g, "")).filter(Boolean)),
    [leads]
  );
  const existingEmails = useMemo(
    () => new Set(leads.map((l) => normalize(l.email ?? "")).filter(Boolean)),
    [leads]
  );

  if (!canImport) {
    return (
      <div className="space-y-4">
        <PageHeader title="Importar leads" description="Sin acceso" />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Esta función está disponible solo para perfiles Supervisor y Administrador.
          </CardContent>
        </Card>
      </div>
    );
  }

  const downloadTemplate = () => {
    const example: Row[] = [
      {
        nombre: "Juan Pérez",
        telefono: "1122334455",
        email: "juan@example.com",
        origen: "Instagram",
        producto_interes: "Toyota Corolla 2024",
        estado_inicial: "nuevo",
        vendedor_asignado: sellers[0]?.name ?? "",
      },
      {
        nombre: "María Gómez",
        telefono: "1199887766",
        email: "maria@example.com",
        origen: "WhatsApp",
        producto_interes: "",
        estado_inicial: "contactado",
        vendedor_asignado: "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(example, { header: [...TEMPLATE_HEADERS] });
    ws["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    // Hoja de ayuda
    const help = [
      ["Instrucciones"],
      ["- nombre: obligatorio"],
      ["- telefono / email: al menos uno de los dos"],
      ["- origen: cualquier texto (Web, WhatsApp, Referido, etc.)"],
      ["- estado_inicial: nuevo | contactado | en_negociacion | proximo_a_vender"],
      ["- vendedor_asignado: nombre o email del vendedor (opcional)"],
      ["- No modifiques los encabezados de la primera fila."],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(help), "Instrucciones");
    XLSX.writeFile(wb, "plantilla-leads-atlas.xlsx");
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });

    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    const parsed: ParsedRow[] = raw.map((r, idx) => {
      const row = {} as Row;
      for (const h of TEMPLATE_HEADERS) {
        const val = r[h] ?? r[h.replace("_", " ")] ?? r[h.toUpperCase()] ?? "";
        row[h] = String(val ?? "").trim();
      }
      const errors: string[] = [];
      const warnings: string[] = [];

      const name = row.nombre;
      const phone = row.telefono.replace(/\s+/g, "");
      const email = normalize(row.email);
      const source = row.origen || "Importación";
      const product = row.producto_interes;
      const statusRaw = row.estado_inicial;
      const sellerRaw = row.vendedor_asignado;

      if (!name) errors.push("Falta nombre");
      if (!phone && !email) errors.push("Falta teléfono o email");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email inválido");

      const status = statusFromLabel(statusRaw);
      if (status === null) errors.push(`Estado inválido "${statusRaw}"`);

      let sellerId: string | null = null;
      if (sellerRaw) {
        sellerId = sellerLookup.get(normalize(sellerRaw)) ?? null;
        if (!sellerId) warnings.push(`Vendedor "${sellerRaw}" no encontrado, quedará sin asignar`);
      }

      // Duplicados: dentro del propio archivo + contra existentes
      const phoneKey = phone.replace(/\D/g, "");
      let duplicate: ParsedRow["duplicate"] = null;
      const phoneDup = phoneKey && (existingPhones.has(phoneKey) || seenPhones.has(phoneKey));
      const emailDup = email && (existingEmails.has(email) || seenEmails.has(email));
      if (phoneDup && emailDup) duplicate = "both";
      else if (phoneDup) duplicate = "phone";
      else if (emailDup) duplicate = "email";
      if (duplicate) warnings.push(`Posible duplicado por ${duplicate === "both" ? "teléfono y email" : duplicate === "phone" ? "teléfono" : "email"}`);

      if (phoneKey) seenPhones.add(phoneKey);
      if (email) seenEmails.add(email);

      return {
        rowNumber: idx + 2,
        raw: row,
        errors,
        warnings,
        duplicate,
        lead: errors.length
          ? null
          : {
              name,
              phone: phone || null,
              email: email || null,
              source,
              product_interest: product || null,
              status: status as LeadStatus,
              assigned_user_id: sellerId,
              temperature: "tibio",
            },
      };
    });

    setRows(parsed);
  };

  const reset = () => {
    setRows(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const stats = useMemo(() => {
    if (!rows) return null;
    const total = rows.length;
    const withErrors = rows.filter((r) => r.errors.length > 0).length;
    const duplicates = rows.filter((r) => r.duplicate).length;
    const importable = rows.filter((r) => r.lead).length;
    return { total, withErrors, duplicates, importable };
  }, [rows]);

  const confirmImport = () => {
    if (!rows) return;
    setImporting(true);
    let count = 0;
    for (const r of rows) {
      if (!r.lead) continue;
      createLead(r.lead as Partial<Lead>);
      count++;
    }
    setImporting(false);
    toast(`${count} leads importados`);
    navigate("/leads");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar leads"
        description="Cargá leads en lote desde un Excel con la plantilla oficial."
        actions={
          <Button variant="outline" asChild>
            <Link to="/leads"><ArrowLeft className="size-4" /> Volver</Link>
          </Button>
        }
      />

      {/* Paso 1: plantilla */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <p className="font-medium">1. Descargá la plantilla</p>
              <p className="text-sm text-muted-foreground">
                Excel con las columnas correctas y una hoja de instrucciones.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="size-4" /> Descargar plantilla
          </Button>
        </CardContent>
      </Card>

      {/* Paso 2: subir */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Upload className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">2. Subí el archivo completado</p>
              <p className="text-sm text-muted-foreground">
                Aceptamos .xlsx o .xls. Validamos antes de importar.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-muted/50">
            <Upload className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {fileName ? fileName : "Hacé clic para seleccionar un archivo"}
            </p>
            <p className="text-xs text-muted-foreground">.xlsx / .xls</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {fileName && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="size-4" /> Quitar archivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paso 3: preview */}
      {rows && stats && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">3. Revisá y confirmá</p>
              <Badge variant="default">{stats.total} filas</Badge>
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                {stats.importable} listos
              </Badge>
              {stats.withErrors > 0 && (
                <Badge variant="destructive">{stats.withErrors} con errores</Badge>
              )}
              {stats.duplicates > 0 && (
                <Badge variant="default" className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  {stats.duplicates} duplicados
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Contacto</th>
                    <th className="p-2">Origen</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2">Vendedor</th>
                    <th className="p-2">Estado fila</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const hasError = r.errors.length > 0;
                    const hasWarn = r.warnings.length > 0;
                    return (
                      <tr
                        key={r.rowNumber}
                        className={
                          hasError
                            ? "bg-destructive/5"
                            : hasWarn
                              ? "bg-amber-500/5"
                              : "hover:bg-muted/30"
                        }
                      >
                        <td className="p-2 text-muted-foreground">{r.rowNumber}</td>
                        <td className="p-2 font-medium">{r.raw.nombre || "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {r.raw.telefono && <div>{r.raw.telefono}</div>}
                          {r.raw.email && <div>{r.raw.email}</div>}
                        </td>
                        <td className="p-2">{r.raw.origen || "—"}</td>
                        <td className="p-2">{r.raw.estado_inicial || "nuevo"}</td>
                        <td className="p-2">{r.raw.vendedor_asignado || "—"}</td>
                        <td className="p-2">
                          {hasError ? (
                            <div className="flex items-start gap-1.5 text-destructive">
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                              <span className="text-xs">{r.errors.join(", ")}</span>
                            </div>
                          ) : hasWarn ? (
                            <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                              <span className="text-xs">{r.warnings.join(", ")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              <span className="text-xs">OK</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button
                onClick={confirmImport}
                disabled={importing || stats.importable === 0}
              >
                Importar {stats.importable} {stats.importable === 1 ? "lead" : "leads"}
                {stats.duplicates > 0 ? " (incluye duplicados)" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
