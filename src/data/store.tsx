import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
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
  AutomationRule,
} from "@/types";
import { buildSeedState } from "./seed";
import { uid } from "@/lib/utils";

const STORAGE_KEY = "surf-sales-os:data:v1";

function loadState(): DataState {
  if (typeof window === "undefined") return buildSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DataState;
  } catch {
    /* ignore */
  }
  return buildSeedState();
}

interface DataContextValue extends DataState {
  // Company / branding
  updateCompany: (patch: Partial<Company>) => void;
  // Leads
  createLead: (input: Partial<Lead>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addInteraction: (input: Omit<LeadInteraction, "id" | "created_at">) => void;
  // Clients
  createClient: (input: Partial<Client>) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  // Products
  createProduct: (input: Partial<Product>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  // Tasks
  createTask: (input: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  // Users
  updateUser: (id: string, patch: Partial<User>) => void;
  // Quotes & simulations
  createQuote: (input: Partial<Quote>) => Quote;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  createSimulation: (input: Partial<FinancialSimulation>) => FinancialSimulation;
  // Templates
  createTemplate: (input: Partial<MessageTemplate>) => MessageTemplate;
  updateTemplate: (id: string, patch: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  // Automation
  toggleAutomation: (id: string) => void;
  // Utils
  resetDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  const nowIso = () => new Date().toISOString();

  const value = useMemo<DataContextValue>(() => {
    const companyId = state.company.id;

    return {
      ...state,

      updateCompany: (patch) =>
        setState((s) => ({ ...s, company: { ...s.company, ...patch } })),

      createLead: (input) => {
        const lead: Lead = {
          id: uid("lead"),
          company_id: companyId,
          assigned_user_id: input.assigned_user_id ?? null,
          client_id: input.client_id ?? null,
          name: input.name ?? "Sin nombre",
          phone: input.phone ?? null,
          email: input.email ?? null,
          source: input.source ?? "Web",
          status: input.status ?? "nuevo",
          temperature: input.temperature ?? "tibio",
          product_interest: input.product_interest ?? null,
          next_contact_at: input.next_contact_at ?? null,
          notes: input.notes ?? null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
        return lead;
      },

      updateLead: (id, patch) =>
        setState((s) => ({
          ...s,
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...patch, updated_at: nowIso() } : l
          ),
        })),

      deleteLead: (id) =>
        setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) })),

      addInteraction: (input) =>
        setState((s) => ({
          ...s,
          interactions: [
            { ...input, id: uid("int"), created_at: nowIso() },
            ...s.interactions,
          ],
          leads: s.leads.map((l) =>
            l.id === input.lead_id ? { ...l, updated_at: nowIso() } : l
          ),
        })),

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
        setState((s) => ({ ...s, clients: [client, ...s.clients] }));
        return client;
      },

      updateClient: (id, patch) =>
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

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
        setState((s) => ({ ...s, products: [product, ...s.products] }));
        return product;
      },

      updateProduct: (id, patch) =>
        setState((s) => ({
          ...s,
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      createTask: (input) => {
        const task: Task = {
          id: uid("task"),
          company_id: companyId,
          assigned_user_id: input.assigned_user_id ?? null,
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
        setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, patch) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleTaskComplete: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === "completada" ? "pendiente" : "completada" }
              : t
          ),
        })),

      updateUser: (id, patch) =>
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),

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
          user_id: input.user_id ?? "user_v1",
          list_price: list,
          discount,
          expenses,
          final_price: input.final_price ?? list - discount + expenses,
          financing_summary: input.financing_summary ?? null,
          status: input.status ?? "borrador",
          created_at: nowIso(),
        };
        setState((s) => ({ ...s, quotes: [quote, ...s.quotes] }));
        return quote;
      },

      updateQuote: (id, patch) =>
        setState((s) => ({
          ...s,
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),

      createSimulation: (input) => {
        const sim: FinancialSimulation = {
          id: uid("sim"),
          company_id: companyId,
          lead_id: input.lead_id ?? null,
          product_id: input.product_id ?? null,
          price: input.price ?? 0,
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
    };
  }, [state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
