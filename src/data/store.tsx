import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AuditLogEntry,
  Client,
  Company,
  DataState,
  Lead,
  LeadInteraction,
  MessageTemplate,
  Product,
  Quote,
  FinancialSimulation,
  Task,
  User,
  UserRole,
} from "@/types";
import { buildSeedState } from "./seed";
import { uid } from "@/lib/utils";
import { AUTO_CLOSE_DAYS, daysWithoutManagement, NO_AUTO_SWEEP } from "@/lib/lead-management";
import { pushEventToGoogle, removeEventFromGoogle, getConnection } from "@/lib/google-calendar";
import { getStoredUtm, fireLeadConversion, clearStoredUtm } from "@/lib/tracking";
import { pickAssignee } from "@/lib/lead-distribution";

function syncTaskToGCal(task: Task) {
  if (typeof window === "undefined") return;
  const userId = task.assigned_user_id;
  if (!userId) return;
  if (getConnection(userId).status !== "connected") return;
  const start = task.due_time ? `${task.due_date}T${task.due_time}` : `${task.due_date}T09:00`;
  pushEventToGoogle(userId, {
    id: task.id,
    source: task.lead_id ? "crm-followup" : "crm-task",
    title: task.title,
    description: task.description ?? undefined,
    start: new Date(start).toISOString(),
    lead_id: task.lead_id ?? null,
  });
}

function removeTaskFromGCal(taskId: string) {
  if (typeof window === "undefined") return;
  // Broadcast: remove from any connected user's mirror.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("atlas-sales-os:gcal:")) {
      const userId = key.split(":").pop()!;
      removeEventFromGoogle(userId, taskId);
    }
  }
}

const STORAGE_KEY = "atlas-sales-os:data:v3";

function loadState(): DataState {
  if (typeof window === "undefined") return buildSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DataState;
      if (!parsed.auditLog) parsed.auditLog = [];
      if (!parsed.remarketingRequests) parsed.remarketingRequests = [];
      if (!parsed.leadDistribution) {
        parsed.leadDistribution = {
          mode: "round_robin",
          rr_pointer: 0,
          rules: [],
          fallback_user_id: null,
        };
      }
      // Aseguramos last_management_at para datos previos.
      parsed.leads = parsed.leads.map((l) => ({
        ...l,
        last_management_at: l.last_management_at ?? l.updated_at ?? l.created_at,
        remarketing_since: l.remarketing_since ?? (l.status === "remarketing" ? l.updated_at : null),
        remarketing_reason: l.remarketing_reason ?? null,
      }));
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return buildSeedState();
}

interface AuditInput {
  action: string;
  resource: string;
  resource_id?: string | null;
  meta?: string | null;
}

interface DataContextValue extends DataState {
  updateCompany: (patch: Partial<Company>) => void;
  createLead: (input: Partial<Lead>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addInteraction: (input: Omit<LeadInteraction, "id" | "created_at">) => void;
  createClient: (input: Partial<Client>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  createProduct: (input: Partial<Product>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  createTask: (input: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  registerUser: (input: {
    name: string;
    email: string;
    password_hash: string;
    role?: UserRole;
  }) => User;
  createQuote: (input: Partial<Quote>) => Quote;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  createSimulation: (input: Partial<FinancialSimulation>) => FinancialSimulation;
  createTemplate: (input: Partial<MessageTemplate>) => MessageTemplate;
  updateTemplate: (id: string, patch: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleAutomation: (id: string) => void;
  resetDemo: () => void;
  /** Actualiza la configuración de distribución de leads. */
  updateDistributionConfig: (patch: Partial<import("@/types").LeadDistributionConfig>) => void;
  /** Registra un evento en el log de auditoría con el usuario actual. */
  logAudit: (entry: AuditInput) => void;
  /** Session pasa el usuario actual acá para que el store lo use en auditoría. */
  _setActor: (user: User | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(loadState);
  const actorRef = useRef<User | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  // Barrido: leads sin gestión >= AUTO_CLOSE_DAYS pasan a "remarketing"
  // conservando su vendedor asignado (no se reasignan automáticamente).
  useEffect(() => {
    const sweep = () => {
      setState((s) => {
        const stale = s.leads.filter(
          (l) => !NO_AUTO_SWEEP.includes(l.status) && daysWithoutManagement(l) >= AUTO_CLOSE_DAYS
        );
        if (stale.length === 0) return s;
        const staleIds = new Set(stale.map((l) => l.id));
        const now = new Date().toISOString();
        const leads = s.leads.map((l) =>
          staleIds.has(l.id)
            ? {
                ...l,
                status: "remarketing" as const,
                remarketing_since: l.remarketing_since ?? now,
                remarketing_reason: `Sin gestión ${AUTO_CLOSE_DAYS}+ días`,
                updated_at: now,
              }
            : l
        );
        const auditEntries: AuditLogEntry[] = stale.map((l) => ({
          id: uid("audit"),
          user_id: null,
          user_name: "Sistema",
          action: "auto_remarketing",
          resource: "lead",
          resource_id: l.id,
          meta: `Derivado a Remarketing · sin gestión hace ${daysWithoutManagement(l)}d`,
          created_at: now,
        }));
        return { ...s, leads, auditLog: [...auditEntries, ...s.auditLog].slice(0, 500) };
      });
    };
    sweep();
    const t = window.setInterval(sweep, 60 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);


  const nowIso = () => new Date().toISOString();

  const pushAudit = useCallback(
    (s: DataState, entry: AuditInput): DataState => {
      const actor = actorRef.current;
      const record: AuditLogEntry = {
        id: uid("audit"),
        user_id: actor?.id ?? null,
        user_name: actor?.name ?? "Sistema",
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resource_id ?? null,
        meta: entry.meta ?? null,
        created_at: nowIso(),
      };
      return { ...s, auditLog: [record, ...s.auditLog].slice(0, 500) };
    },
    []
  );

  const value = useMemo<DataContextValue>(() => {
    const companyId = state.company.id;

    const withAudit = (updater: (s: DataState) => DataState, entry: AuditInput) =>
      setState((s) => pushAudit(updater(s), entry));

    return {
      ...state,

      _setActor: (u) => {
        actorRef.current = u;
      },

      logAudit: (entry) => setState((s) => pushAudit(s, entry)),

      updateCompany: (patch) =>
        withAudit(
          (s) => ({ ...s, company: { ...s.company, ...patch } }),
          { action: "update", resource: "company" }
        ),

      createLead: (input) => {
        const now = nowIso();
        const utm = getStoredUtm();
        // Auto-asignación según distribución configurada, si no vino explícito.
        let assignedId = input.assigned_user_id ?? null;
        let rrAdvance: number | null = null;
        let assignReason: string | null = null;
        if (!assignedId) {
          const result = pickAssignee(input, state.leadDistribution, state.users);
          assignedId = result.user_id;
          assignReason = result.reason;
          if (result.reason === "round_robin") rrAdvance = result.next_pointer;
        }
        // Si sigue sin asignar, usar el actor como último recurso (caso login vendedor creando lead propio).
        if (!assignedId && actorRef.current?.role === "vendedor") {
          assignedId = actorRef.current.id;
          assignReason = assignReason ?? "manual";
        }
        const lead: Lead = {
          id: uid("lead"),
          company_id: companyId,
          assigned_user_id: assignedId,
          client_id: input.client_id ?? null,
          name: input.name ?? "Sin nombre",
          phone: input.phone ?? null,
          email: input.email ?? null,
          source: input.source ?? utm?.utm_source ?? "Web",
          status: input.status ?? "nuevo",
          temperature: input.temperature ?? "tibio",
          product_interest: input.product_interest ?? null,
          next_contact_at: input.next_contact_at ?? null,
          notes: input.notes ?? null,
          last_management_at: now,
          remarketing_since: input.status === "remarketing" ? now : null,
          remarketing_reason: input.remarketing_reason ?? null,
          utm_source: input.utm_source ?? utm?.utm_source ?? null,
          utm_medium: input.utm_medium ?? utm?.utm_medium ?? null,
          utm_campaign: input.utm_campaign ?? utm?.utm_campaign ?? null,
          utm_term: input.utm_term ?? utm?.utm_term ?? null,
          utm_content: input.utm_content ?? utm?.utm_content ?? null,
          gclid: input.gclid ?? utm?.gclid ?? null,
          fbclid: input.fbclid ?? utm?.fbclid ?? null,
          landing_url: input.landing_url ?? utm?.landing_url ?? null,
          created_at: now,
          updated_at: now,
        };
        const assigneeName = assignedId
          ? state.users.find((u) => u.id === assignedId)?.name ?? null
          : null;
        withAudit(
          (s) => {
            const nextDistribution =
              rrAdvance !== null
                ? { ...s.leadDistribution, rr_pointer: rrAdvance }
                : s.leadDistribution;
            return { ...s, leads: [lead, ...s.leads], leadDistribution: nextDistribution };
          },
          {
            action: "create",
            resource: "lead",
            resource_id: lead.id,
            meta: assigneeName
              ? `${lead.name} → ${assigneeName} (${assignReason ?? "auto"})`
              : lead.name,
          }
        );
        // Disparar conversión si el lead vino de una campaña rastreable.
        const fromCampaign = Boolean(lead.utm_source || lead.gclid || lead.fbclid);
        if (fromCampaign) {
          fireLeadConversion({
            lead_id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.utm_source ?? lead.source,
          });
          clearStoredUtm();
        }
        return lead;
      },

      updateLead: (id, patch) =>
        withAudit(
          (s) => ({
            ...s,
            leads: s.leads.map((l) => {
              if (l.id !== id) return l;
              const now = nowIso();
              // Si el patch trae explícitamente last_management_at (ej. auto-cierre),
              // lo respetamos; si no, cualquier edición manual cuenta como gestión.
              const bumpMgmt = patch.last_management_at === undefined;
              const enteringRemarketing =
                patch.status === "remarketing" && l.status !== "remarketing";
              return {
                ...l,
                ...patch,
                remarketing_since: enteringRemarketing
                  ? patch.remarketing_since ?? now
                  : patch.remarketing_since ?? l.remarketing_since ?? null,
                remarketing_reason: enteringRemarketing
                  ? patch.remarketing_reason ?? "Derivado manualmente"
                  : patch.remarketing_reason ?? l.remarketing_reason ?? null,
                updated_at: now,
                last_management_at: bumpMgmt ? now : patch.last_management_at ?? l.last_management_at,
              };
            }),
          }),
          { action: "update", resource: "lead", resource_id: id, meta: Object.keys(patch).join(", ") }
        ),

      deleteLead: (id) =>
        withAudit(
          (s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }),
          { action: "delete", resource: "lead", resource_id: id }
        ),

      addInteraction: (input) =>
        withAudit(
          (s) => {
            const now = nowIso();
            return {
              ...s,
              interactions: [
                { ...input, id: uid("int"), created_at: now },
                ...s.interactions,
              ],
              leads: s.leads.map((l) =>
                l.id === input.lead_id
                  ? { ...l, updated_at: now, last_management_at: now }
                  : l
              ),
            };
          },
          { action: "create", resource: "interaction", resource_id: input.lead_id, meta: input.type }
        ),

      createClient: (input) => {
        const client: Client = {
          id: uid("client"),
          company_id: companyId,
          name: input.name ?? "Sin nombre",
          phone: input.phone ?? null,
          email: input.email ?? null,
          company_name: input.company_name ?? null,
          city: input.city ?? null,
          notes: input.notes ?? null,
          created_at: nowIso(),
        };
        withAudit(
          (s) => ({ ...s, clients: [client, ...s.clients] }),
          { action: "create", resource: "client", resource_id: client.id, meta: client.name }
        );
        return client;
      },

      updateClient: (id, patch) =>
        withAudit(
          (s) => ({
            ...s,
            clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          }),
          { action: "update", resource: "client", resource_id: id }
        ),

      createProduct: (input) => {
        const product: Product = {
          id: uid("prod"),
          company_id: companyId,
          name: input.name ?? "Producto",
          brand: input.brand ?? "",
          category: input.category ?? "General",
          condition: input.condition ?? "nuevo",
          version: input.version ?? null,
          year: input.year ?? null,
          mileage_km: input.mileage_km ?? null,
          fuel: input.fuel ?? null,
          transmission: input.transmission ?? null,
          list_price: input.list_price ?? 0,
          promo_price: input.promo_price ?? null,
          availability: input.availability ?? 0,
          status: input.status ?? "disponible",
          description: input.description ?? null,
          images: input.images ?? [],
          image_url: input.image_url ?? input.images?.[0] ?? null,
          internal_notes: input.internal_notes ?? null,
          created_at: nowIso(),
        };
        withAudit(
          (s) => ({ ...s, products: [product, ...s.products] }),
          { action: "create", resource: "product", resource_id: product.id, meta: product.name }
        );
        return product;
      },

      updateProduct: (id, patch) =>
        withAudit(
          (s) => ({
            ...s,
            products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          }),
          { action: "update", resource: "product", resource_id: id }
        ),

      createTask: (input) => {
        const task: Task = {
          id: uid("task"),
          company_id: companyId,
          assigned_user_id: input.assigned_user_id ?? actorRef.current?.id ?? null,
          lead_id: input.lead_id ?? null,
          client_id: input.client_id ?? null,
          title: input.title ?? "Tarea",
          description: input.description ?? null,
          due_date: input.due_date ?? nowIso(),
          due_time: input.due_time ?? null,
          priority: input.priority ?? "media",
          status: input.status ?? "pendiente",
          created_at: nowIso(),
        };
        withAudit(
          (s) => ({ ...s, tasks: [task, ...s.tasks] }),
          { action: "create", resource: "task", resource_id: task.id, meta: task.title }
        );
        syncTaskToGCal(task);
        return task;
      },

      updateTask: (id, patch) => {
        let updated: Task | undefined;
        withAudit(
          (s) => {
            const tasks = s.tasks.map((t) => {
              if (t.id !== id) return t;
              updated = { ...t, ...patch };
              return updated;
            });
            return { ...s, tasks };
          },
          { action: "update", resource: "task", resource_id: id }
        );
        if (updated) syncTaskToGCal(updated);
      },

      toggleTaskComplete: (id) =>
        withAudit(
          (s) => ({
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === id
                ? { ...t, status: t.status === "completada" ? "pendiente" : "completada" }
                : t
            ),
          }),
          { action: "toggle", resource: "task", resource_id: id }
        ),

      deleteTask: (id) => {
        withAudit(
          (s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }),
          { action: "delete", resource: "task", resource_id: id }
        );
        removeTaskFromGCal(id);
      },

      updateUser: (id, patch) =>
        withAudit(
          (s) => ({
            ...s,
            users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          }),
          { action: "update", resource: "user", resource_id: id, meta: Object.keys(patch).join(", ") }
        ),

      registerUser: (input) => {
        const user: User = {
          id: uid("user"),
          company_id: companyId,
          name: input.name,
          email: input.email.toLowerCase(),
          phone: null,
          role: input.role ?? "vendedor",
          avatar_url: null,
          active: true,
          supervisor_id: null,
          password_hash: input.password_hash,
          created_at: nowIso(),
        };
        withAudit(
          (s) => ({ ...s, users: [...s.users, user] }),
          { action: "register", resource: "user", resource_id: user.id, meta: user.email }
        );
        return user;
      },

      createQuote: (input) => {
        const list = input.list_price ?? 0;
        const discount = input.discount ?? 0;
        const expenses = input.expenses ?? 0;
        const quote: Quote = {
          id: uid("quote"),
          company_id: companyId,
          lead_id: input.lead_id ?? null,
          client_id: input.client_id ?? null,
          product_id: input.product_id ?? null,
          user_id: input.user_id ?? actorRef.current?.id ?? "user_v1",
          list_price: list,
          discount,
          expenses,
          trade_in_value: input.trade_in_value ?? 0,
          final_price:
            input.final_price ?? list - discount + expenses - (input.trade_in_value ?? 0),
          financing_summary: input.financing_summary ?? null,
          status: input.status ?? "borrador",
          created_at: nowIso(),
        };
        withAudit(
          (s) => ({ ...s, quotes: [quote, ...s.quotes] }),
          { action: "create", resource: "quote", resource_id: quote.id }
        );
        return quote;
      },

      updateQuote: (id, patch) =>
        withAudit(
          (s) => ({
            ...s,
            quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
          }),
          { action: "update", resource: "quote", resource_id: id }
        ),

      createSimulation: (input) => {
        const sim: FinancialSimulation = {
          id: uid("sim"),
          company_id: companyId,
          lead_id: input.lead_id ?? null,
          product_id: input.product_id ?? null,
          price: input.price ?? 0,
          trade_in_value: input.trade_in_value ?? 0,
          down_payment: input.down_payment ?? 0,
          financed_amount: input.financed_amount ?? 0,
          term_months: input.term_months ?? 12,
          rate: input.rate ?? 0.45,
          estimated_payment: input.estimated_payment ?? 0,
          created_at: nowIso(),
        };
        setState((s) => ({ ...s, simulations: [sim, ...s.simulations] }));
        return sim;
      },

      createTemplate: (input) => {
        const tpl: MessageTemplate = {
          id: uid("tpl"),
          company_id: companyId,
          title: input.title ?? "Plantilla",
          category: input.category ?? "seguimiento",
          body: input.body ?? "",
          created_at: nowIso(),
        };
        setState((s) => ({ ...s, templates: [tpl, ...s.templates] }));
        return tpl;
      },

      updateTemplate: (id, patch) =>
        setState((s) => ({
          ...s,
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTemplate: (id) =>
        setState((s) => ({
          ...s,
          templates: s.templates.filter((t) => t.id !== id),
        })),

      toggleAutomation: (id) =>
        setState((s) => ({
          ...s,
          automationRules: s.automationRules.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r
          ),
        })),

      resetDemo: () => {
        const fresh = buildSeedState();
        setState(fresh);
      },

      updateDistributionConfig: (patch) =>
        withAudit(
          (s) => ({ ...s, leadDistribution: { ...s.leadDistribution, ...patch } }),
          { action: "update", resource: "lead_distribution", meta: patch.mode ?? null }
        ),
    };
  }, [state, pushAudit]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
