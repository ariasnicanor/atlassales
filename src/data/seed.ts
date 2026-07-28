import type {
  AutomationRule,
  AiLeadScore,
  Client,
  Company,
  DataState,
  FinancialSimulation,
  Goal,
  Lead,
  LeadInteraction,
  LeadStatus,
  MessageTemplate,
  Product,
  Sale,
  Task,
  Temperature,
  User,
  Quote,
} from "@/types";
import { DEMO_PASSWORD_HASH } from "@/lib/auth";


// ─────────────────────────────────────────────────────────────
// Demo seed — "Atlas Demo Company"
// Genera actividad realista de una empresa comercial para que la
// app se vea vendible apenas se abre. Fechas relativas a hoy.
// ─────────────────────────────────────────────────────────────

/** Deterministic RNG so the demo looks consistent across reloads. */
function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

const now = new Date();
function offset(days: number, hours = 9) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}
const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const COMPANY_ID = "comp_atlas_demo";

export const demoCompany: Company = {
  id: COMPANY_ID,
  name: "Atlas Demo Company",
  logo_url: null,
  primary_color: "#0EA5E9",
  secondary_color: "#7C3AED",
  industry: "Concesionaria",
  slogan: "Menos tiempo cargando. Más tiempo vendiendo.",
  active_plans: ["core", "growth"],
  created_at: offset(-420),
};

// ── Usuarios ──────────────────────────────────────────────────
export const demoUsers: User[] = ([
  {
    id: "user_admin",
    company_id: COMPANY_ID,
    name: "Diego Sandoval",
    email: "diego@tuempresa.com",
    role: "admin",
    avatar_url: null,
    active: true,
    created_at: offset(-400),
  },
  {
    id: "user_sup",
    company_id: COMPANY_ID,
    name: "Carolina Ruiz",
    email: "carolina@tuempresa.com",
    role: "supervisor",
    avatar_url: null,
    active: true,
    created_at: offset(-380),
  },
  {
    id: "user_v1",
    company_id: COMPANY_ID,
    name: "Martín Pereyra",
    email: "martin@tuempresa.com",
    role: "vendedor",
    avatar_url: null,
    active: true,
    created_at: offset(-360),
  },
  {
    id: "user_v2",
    company_id: COMPANY_ID,
    name: "Lucía Gómez",
    email: "lucia@tuempresa.com",
    role: "vendedor",
    avatar_url: null,
    active: true,
    created_at: offset(-355),
  },
  {
    id: "user_v3",
    company_id: COMPANY_ID,
    name: "Federico Aguirre",
    email: "federico@tuempresa.com",
    role: "vendedor",
    avatar_url: null,
    active: true,
    created_at: offset(-300),
  },
  {
    id: "user_v4",
    company_id: COMPANY_ID,
    name: "Sofía Navarro",
    email: "sofia@tuempresa.com",
    role: "vendedor",
    avatar_url: null,
    active: true,
    created_at: offset(-200),
  },
  {
    id: "user_v5",
    company_id: COMPANY_ID,
    name: "Julián Costa",
    email: "julian@tuempresa.com",
    role: "vendedor",
    avatar_url: null,
    active: false,
    created_at: offset(-120),
  },
  {
    id: "user_rec",
    company_id: COMPANY_ID,
    name: "Valentina Ríos",
    email: "recepcion@tuempresa.com",
    role: "recepcion",
    avatar_url: null,
    active: true,
    created_at: offset(-180),
  },
] as User[]).map((u, i) => ({
  ...u,
  phone: `+54 9 266 ${String(420100 + i * 137).slice(0, 6)}`,
  password_hash: DEMO_PASSWORD_HASH,
  supervisor_id: u.role === "vendedor" ? "user_sup" : null,
}));

const sellerIds = ["user_v1", "user_v2", "user_v3", "user_v4", "user_v5"];

// ── Clientes (20) ─────────────────────────────────────────────
const clientNames = [
  "Roberto Méndez",
  "Valeria Sosa",
  "Andrés Quiroga",
  "Marina López",
  "Gustavo Ferreyra",
  "Paula Bianchi",
  "Hernán Duarte",
  "Camila Vega",
  "Ricardo Ibáñez",
  "Florencia Ramos",
  "Sebastián Molina",
  "Agustina Cabrera",
  "Pablo Herrera",
  "Daniela Acosta",
  "Nicolás Funes",
  "Carla Medina",
  "Esteban Rios",
  "Lorena Paz",
  "Maximiliano Soria",
  "Verónica Luna",
];
const cities = [
  "San Luis",
  "Villa Mercedes",
  "Mendoza",
  "Córdoba",
  "Rosario",
  "Buenos Aires",
  "Río Cuarto",
  "San Juan",
];
const companyNames = [
  "Agro del Sur SRL",
  "Constructora Norte",
  "Transporte La Punta",
  "",
  "",
  "Servicios Cuyo SA",
  "",
  "Logística Andina",
];

export const demoClients: Client[] = clientNames.map((name, i) => ({
  id: `client_${i + 1}`,
  company_id: COMPANY_ID,
  name,
  phone: `+54 9 266 ${String(400000 + i * 137).slice(0, 6)}`,
  email: `${name.toLowerCase().replace(/[^a-z]/g, ".").replace(/\.+/g, ".")}@mail.com`,
  company_name: companyNames[i % companyNames.length] || null,
  city: cities[i % cities.length],
  notes: i % 4 === 0 ? "Cliente recurrente. Prioridad alta." : null,
  created_at: offset(-(60 + i * 5)),
}));

// ── Productos (15) ────────────────────────────────────────────
type SeedProduct = Omit<Product, "id" | "company_id" | "created_at">;
// Fotos demo (Unsplash). La UI tiene fallback si no cargan.
const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
const IMG = {
  pickup: [U("1605559424843-9e4c228bf1c2"), U("1568605117036-5fe5e7bab0b7")],
  suv: [U("1606664515524-ed2f786a0bd6"), U("1519641471654-76ce0107ad1b")],
  suv2: [U("1494976388531-d1058494cdd8")],
  sedan: [U("1549924231-f129b911e442"), U("1552519507-da3b142c6e3d")],
  kicks: [U("1583121274602-3e2820c69888"), U("1542362567-b07e54358753")],
  van: [U("1632823471565-1ecdf5c6da77")],
  tractor: [U("1530267981375-f0de937f5f13")],
  machine: [U("1581092334651-ddf26d9a09d0")],
  equip: [U("1581094794329-c8112a89af12")],
};

const productSeeds: SeedProduct[] = [
  { name: "Hilux SRV 4x4", brand: "Toyota", category: "Pickups", condition: "nuevo", version: "SRV 2.8 TDI 4x4 AT", year: 2024, mileage_km: null, fuel: "Diésel", transmission: "Automática", list_price: 58000000, promo_price: 55500000, availability: 3, status: "disponible", description: "Pickup full, caja automática, tapizado de cuero, control de descenso.", images: IMG.pickup, image_url: IMG.pickup[0], internal_notes: "Unidad de mayor rotación." },
  { name: "Corolla Cross XEI", brand: "Toyota", category: "SUV", condition: "nuevo", version: "XEI 2.0 Hybrid", year: 2024, mileage_km: null, fuel: "Híbrido", transmission: "CVT", list_price: 41000000, promo_price: null, availability: 5, status: "disponible", description: "SUV híbrido, bajo consumo, asistencias de manejo.", images: IMG.suv, image_url: IMG.suv[0], internal_notes: null },
  { name: "Ranger XLT 4x2", brand: "Ford", category: "Pickups", condition: "nuevo", version: "XLT 2.0 TDI 4x2 MT", year: 2024, mileage_km: null, fuel: "Diésel", transmission: "Manual", list_price: 49500000, promo_price: 47900000, availability: 2, status: "disponible", description: "Pickup con paquete de seguridad y conectividad.", images: IMG.pickup, image_url: IMG.pickup[1], internal_notes: null },
  { name: "Nissan Kicks Exclusive", brand: "Nissan", category: "SUV", condition: "usado", version: "Exclusive 1.6 CVT", year: 2019, mileage_km: 109000, fuel: "Nafta", transmission: "Automática", list_price: 28900000, promo_price: null, availability: 1, status: "disponible", description: "Único dueño, service oficial al día, excelente estado. Recibimos tu usado.", images: IMG.kicks, image_url: IMG.kicks[0], internal_notes: "Tomado en parte de pago. Margen bueno." },
  { name: "Amarok Comfortline", brand: "Volkswagen", category: "Pickups", condition: "usado", version: "Comfortline 2.0 TDI 4x4", year: 2021, mileage_km: 78000, fuel: "Diésel", transmission: "Automática", list_price: 41500000, promo_price: null, availability: 1, status: "reservado", description: "Pickup V6, muy cuidada, cubiertas nuevas.", images: IMG.pickup, image_url: IMG.pickup[0], internal_notes: "Reservada por seña." },
  { name: "Taos Highline", brand: "Volkswagen", category: "SUV", condition: "nuevo", version: "Highline 1.4 TSI", year: 2024, mileage_km: null, fuel: "Nafta", transmission: "Automática", list_price: 44000000, promo_price: 42500000, availability: 4, status: "disponible", description: "SUV compacta premium, techo panorámico.", images: IMG.suv2, image_url: IMG.suv2[0], internal_notes: null },
  { name: "Onix Premier", brand: "Chevrolet", category: "Autos", condition: "nuevo", version: "Premier 1.0 Turbo AT", year: 2024, mileage_km: null, fuel: "Nafta", transmission: "Automática", list_price: 31000000, promo_price: null, availability: 6, status: "disponible", description: "Sedán full, turbo, pantalla 8''.", images: IMG.sedan, image_url: IMG.sedan[0], internal_notes: null },
  { name: "Tracker LTZ", brand: "Chevrolet", category: "SUV", condition: "usado", version: "LTZ 1.2 Turbo", year: 2022, mileage_km: 45000, fuel: "Nafta", transmission: "Automática", list_price: 33800000, promo_price: 32900000, availability: 1, status: "disponible", description: "SUV urbana, impecable, garantía vigente.", images: IMG.suv, image_url: IMG.suv[1], internal_notes: null },
  { name: "Kangoo Furgón", brand: "Renault", category: "Utilitarios", condition: "nuevo", version: "Furgón 1.6 Confort", year: 2024, mileage_km: null, fuel: "Nafta", transmission: "Manual", list_price: 28500000, promo_price: null, availability: 4, status: "disponible", description: "Utilitario ideal reparto urbano.", images: IMG.van, image_url: IMG.van[0], internal_notes: null },
  { name: "Master Furgón L2H2", brand: "Renault", category: "Utilitarios", condition: "nuevo", version: "L2H2 2.3 dCi", year: 2024, mileage_km: null, fuel: "Diésel", transmission: "Manual", list_price: 46500000, promo_price: null, availability: 2, status: "disponible", description: "Furgón gran volumen de carga.", images: IMG.van, image_url: IMG.van[0], internal_notes: null },
  { name: "Tractor 5075E", brand: "John Deere", category: "Maquinaria", condition: "nuevo", version: "5075E 75 HP", year: 2024, mileage_km: null, fuel: "Diésel", transmission: "Manual", list_price: 72000000, promo_price: null, availability: 1, status: "disponible", description: "Tractor 75 HP para uso agrícola.", images: IMG.tractor, image_url: IMG.tractor[0], internal_notes: "Margen alto." },
  { name: "Minicargadora 318", brand: "Bobcat", category: "Maquinaria", condition: "nuevo", version: "S70 / 318", year: 2024, mileage_km: null, fuel: "Diésel", transmission: "Hidrostática", list_price: 64000000, promo_price: 61000000, availability: 1, status: "disponible", description: "Minicargadora versátil para obra.", images: IMG.machine, image_url: IMG.machine[0], internal_notes: null },
  { name: "Generador 15KVA", brand: "Honda", category: "Equipamiento", condition: "nuevo", version: "Trifásico 15KVA", year: 2024, mileage_km: null, fuel: "Nafta", transmission: null, list_price: 8900000, promo_price: null, availability: 8, status: "disponible", description: "Grupo electrógeno trifásico.", images: IMG.equip, image_url: IMG.equip[0], internal_notes: null },
  { name: "Compresor 500L", brand: "Schulz", category: "Equipamiento", condition: "nuevo", version: "MSV 40/500", year: 2024, mileage_km: null, fuel: null, transmission: null, list_price: 3200000, promo_price: 2990000, availability: 5, status: "disponible", description: "Compresor industrial 500 litros.", images: IMG.equip, image_url: IMG.equip[0], internal_notes: null },
  { name: "Hidrolavadora HD 6/15", brand: "Kärcher", category: "Equipamiento", condition: "nuevo", version: "HD 6/15 C", year: 2024, mileage_km: null, fuel: null, transmission: null, list_price: 2100000, promo_price: null, availability: 0, status: "vendido", description: "Hidrolavadora profesional de alta presión.", images: IMG.equip, image_url: IMG.equip[0], internal_notes: "Última vendida la semana pasada." },
];

export const demoProducts: Product[] = productSeeds.map((p, i) => ({
  id: `prod_${i + 1}`,
  company_id: COMPANY_ID,
  created_at: offset(-(90 - i)),
  ...p,
}));

// ── Leads (30) ────────────────────────────────────────────────
const leadFirst = [
  "Marcelo", "Romina", "Cristian", "Natalia", "Gabriel", "Yamila", "Leandro",
  "Brenda", "Emanuel", "Antonella", "Damián", "Micaela", "Ezequiel", "Rocío",
  "Franco", "Belén", "Iván", "Tamara", "Lautaro", "Melina", "Joaquín", "Aldana",
  "Tomás", "Carla", "Bruno", "Jesica", "Matías", "Noelia", "Alan", "Sabrina",
];
const leadLast = [
  "Giménez", "Romero", "Suárez", "Ortega", "Vidal", "Cáceres", "Maldonado",
  "Benítez", "Figueroa", "Villalba", "Correa", "Ojeda", "Barrios", "Peralta",
];
const sources = ["Web", "WhatsApp", "Referido", "Instagram", "Showroom", "Campaña Meta", "Llamada entrante", "Mercado Libre"];
const statuses: LeadStatus[] = ["nuevo", "contactado", "en_negociacion", "proximo_a_vender", "vendido", "sin_gestion", "cerrado"];
const temps: Temperature[] = ["frio", "tibio", "caliente"];

// Distribución pensada para que el dashboard se vea activo con el nuevo pipeline.
const statusPlan: LeadStatus[] = [
  "nuevo", "nuevo", "nuevo", "nuevo", "nuevo",
  "contactado", "contactado", "contactado", "contactado",
  "en_negociacion", "en_negociacion", "en_negociacion", "en_negociacion", "en_negociacion",
  "proximo_a_vender", "proximo_a_vender", "proximo_a_vender", "proximo_a_vender",
  "vendido", "vendido", "vendido", "vendido",
  "sin_gestion", "sin_gestion", "sin_gestion",
  "cerrado", "cerrado",
  "en_negociacion", "contactado", "nuevo",
];

// Días sin gestión pensados para mostrar los 3 niveles de indicador (verde/amarillo/rojo).
const managementAgePlan: number[] = [
  0, 1, 2, 3, 4,
  1, 3, 6, 8,
  2, 5, 9, 12, 15,
  1, 3, 10, 18,
  0, 4, 7, 12,
  22, 25, 28, // sin gestión → cerca del auto-cierre
  35, 45,     // ya cerrados
  6, 11, 2,
];

export const demoLeads: Lead[] = statusPlan.map((status, i) => {
  const name = `${leadFirst[i % leadFirst.length]} ${pick(leadLast)}`;
  const temperature: Temperature =
    status === "en_negociacion" || status === "proximo_a_vender"
      ? pick(["tibio", "caliente"] as Temperature[])
      : status === "nuevo"
      ? pick(temps)
      : pick(["frio", "tibio"] as Temperature[]);
  const seller = sellerIds[i % sellerIds.length];
  const product = pick(demoProducts);
  const open = !["vendido", "cerrado"].includes(status);
  const nextContact = open
    ? offset(pick([-4, -2, -1, 0, 1, 2, 3, 5]))
    : null;
  const daysAgo = managementAgePlan[i] ?? 3;
  return {
    id: `lead_${i + 1}`,
    company_id: COMPANY_ID,
    assigned_user_id: seller,
    client_id: i < demoClients.length && i % 3 === 0 ? `client_${i + 1}` : null,
    name,
    phone: `+54 9 266 ${String(500000 + i * 211).slice(0, 6)}`,
    email: i % 2 === 0 ? `${name.toLowerCase().replace(/\s/g, ".")}@mail.com` : null,
    source: pick(sources),
    status,
    temperature,
    product_interest: product.name,
    next_contact_at: nextContact,
    notes: i % 5 === 0 ? "Consultó por financiación a 12 meses." : null,
    last_management_at: offset(-daysAgo),
    created_at: offset(-(daysAgo + 2)),
    updated_at: offset(-daysAgo),
  };
});

// ── Interacciones ─────────────────────────────────────────────
export const demoInteractions: LeadInteraction[] = [];
demoLeads.slice(0, 18).forEach((lead, i) => {
  const count = 1 + (i % 3);
  for (let k = 0; k < count; k++) {
    demoInteractions.push({
      id: `int_${lead.id}_${k}`,
      lead_id: lead.id,
      user_id: lead.assigned_user_id ?? "user_v1",
      type: pick(["llamada", "whatsapp", "email", "nota", "reunion"] as const),
      note: pick([
        "Primer contacto, mostró interés.",
        "Envié información del producto por WhatsApp.",
        "Quedamos en hablar la semana próxima.",
        "Consultó precio de contado y financiado.",
        "Pidió ver la unidad en el showroom.",
        "Comparando con otra marca, hacer seguimiento.",
      ]),
      created_at: offset(-(1 + i + k)),
    });
  }
});

// ── Tareas (40) ───────────────────────────────────────────────
const taskTitles = [
  "Llamar para coordinar visita",
  "Enviar cotización por WhatsApp",
  "Hacer seguimiento de cotización",
  "Confirmar disponibilidad de unidad",
  "Recordar entrega de documentación",
  "Llamar lead caliente",
  "Reagendar reunión",
  "Enviar info de financiación",
  "Pedir feedback post-visita",
  "Cerrar operación",
];

export const demoTasks: Task[] = Array.from({ length: 40 }).map((_, i) => {
  const lead = demoLeads[i % demoLeads.length];
  // Mezcla de vencidas, de hoy, próximas y completadas.
  let due: string;
  let status: Task["status"];
  const bucket = i % 5;
  if (bucket === 0) {
    due = offset(-pick([1, 2, 3]));
    status = "pendiente"; // => se mostrará vencida
  } else if (bucket === 1) {
    due = offset(0, pick([10, 12, 15, 17]));
    status = pick(["pendiente", "en_proceso"] as const);
  } else if (bucket === 2) {
    due = offset(pick([1, 2, 3, 4]));
    status = "pendiente";
  } else {
    due = offset(-pick([2, 4, 6, 8]));
    status = "completada";
  }
  return {
    id: `task_${i + 1}`,
    company_id: COMPANY_ID,
    assigned_user_id: lead.assigned_user_id,
    lead_id: lead.id,
    client_id: lead.client_id,
    title: taskTitles[i % taskTitles.length],
    description: i % 3 === 0 ? "Prioridad por cierre de mes." : null,
    due_date: due,
    due_time: pick(["09:00", "11:30", "15:00", "17:00", null]),
    priority: pick(["baja", "media", "alta"] as const),
    status,
    created_at: offset(-(3 + (i % 10))),
  };
});

// ── Cotizaciones (10) ─────────────────────────────────────────
export const demoQuotes: Quote[] = Array.from({ length: 10 }).map((_, i) => {
  const lead = demoLeads[(i * 2 + 5) % demoLeads.length];
  const product = demoProducts[i % demoProducts.length];
  const list = product.list_price;
  const discount = Math.round(list * pick([0, 0.03, 0.05, 0.07]));
  const expenses = Math.round(list * 0.04);
  return {
    id: `quote_${i + 1}`,
    company_id: COMPANY_ID,
    lead_id: lead.id,
    client_id: lead.client_id,
    product_id: product.id,
    user_id: lead.assigned_user_id ?? "user_v1",
    list_price: list,
    discount,
    expenses,
    final_price: list - discount + expenses,
    financing_summary:
      i % 2 === 0 ? "Anticipo 40% + 12 cuotas fijas" : null,
    status: pick(["borrador", "enviada", "enviada", "aceptada", "rechazada"] as const),
    created_at: offset(-(1 + i)),
  };
});

// ── Simulaciones financieras ──────────────────────────────────
export const demoSimulations: FinancialSimulation[] = Array.from({ length: 8 }).map((_, i) => {
  const lead = demoLeads[(i * 3) % demoLeads.length];
  const product = demoProducts[(i * 2) % demoProducts.length];
  const price = product.promo_price ?? product.list_price;
  const down = Math.round(price * 0.4);
  const financed = price - down;
  const term = pick([12, 18, 24, 36]);
  const rate = pick([0.39, 0.45, 0.55]);
  const monthlyRate = rate / 12;
  const payment = Math.round(
    (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
  );
  return {
    id: `sim_${i + 1}`,
    company_id: COMPANY_ID,
    lead_id: lead.id,
    product_id: product.id,
    price,
    down_payment: down,
    financed_amount: financed,
    term_months: term,
    rate,
    estimated_payment: payment,
    created_at: offset(-(2 + i)),
  };
});

// ── Ventas (6) ────────────────────────────────────────────────
const wonLeads = demoLeads.filter((l) => l.status === "vendido");
export const demoSales: Sale[] = Array.from({ length: 6 }).map((_, i) => {
  const lead = wonLeads[i % wonLeads.length] ?? demoLeads[i];
  const product = demoProducts[(i * 4) % demoProducts.length];
  const amount = product.promo_price ?? product.list_price;
  return {
    id: `sale_${i + 1}`,
    company_id: COMPANY_ID,
    lead_id: lead.id,
    client_id: lead.client_id,
    product_id: product.id,
    user_id: lead.assigned_user_id ?? sellerIds[i % sellerIds.length],
    amount,
    commission_amount: Math.round(amount * 0.02),
    created_at: offset(-(1 + i * 3)),
  };
});

// ── Objetivos ─────────────────────────────────────────────────
export const demoGoals: Goal[] = [
  ...sellerIds.map((id, i) => ({
    id: `goal_${id}`,
    company_id: COMPANY_ID,
    user_id: id,
    period,
    target_amount: [120000000, 100000000, 90000000, 80000000, 60000000][i],
    target_units: [3, 3, 2, 2, 2][i],
    created_at: offset(-15),
  })),
  {
    id: "goal_team",
    company_id: COMPANY_ID,
    user_id: null,
    period,
    target_amount: 450000000,
    target_units: 12,
    created_at: offset(-15),
  },
];

// ── Plantillas comerciales ────────────────────────────────────
export const demoTemplates: MessageTemplate[] = [
  {
    id: "tpl_1",
    company_id: COMPANY_ID,
    title: "Primer contacto",
    category: "primer_contacto",
    body: "Hola {{nombre}}! Soy {{vendedor}} de {{empresa}}. Vi tu consulta por {{producto}} 🙌. ¿Te queda cómodo si te paso la info por acá?",
    created_at: offset(-30),
  },
  {
    id: "tpl_2",
    company_id: COMPANY_ID,
    title: "Seguimiento amable",
    category: "seguimiento",
    body: "Hola {{nombre}}, ¿cómo estás? Te escribo para saber si pudiste ver la propuesta de {{producto}}. Cualquier duda quedo a disposición 😉",
    created_at: offset(-28),
  },
  {
    id: "tpl_3",
    company_id: COMPANY_ID,
    title: "Envío de cotización",
    category: "cotizacion",
    body: "{{nombre}}, te dejo la cotización de {{producto}}: precio final {{precio}}. Incluye {{detalle}}. La oferta es válida por 7 días 🚀",
    created_at: offset(-25),
  },
  {
    id: "tpl_4",
    company_id: COMPANY_ID,
    title: "Recuperación de lead frío",
    category: "recuperacion",
    body: "Hola {{nombre}}! Volvemos a estar en contacto 🙌 Tenemos una promo nueva en {{producto}}. ¿Querés que te cuente los detalles?",
    created_at: offset(-20),
  },
  {
    id: "tpl_5",
    company_id: COMPANY_ID,
    title: "Confirmación de visita",
    category: "seguimiento",
    body: "{{nombre}}, te confirmo la visita para {{fecha}} en nuestro showroom. Te esperamos para mostrarte {{producto}} en persona 🚗",
    created_at: offset(-18),
  },
  {
    id: "tpl_6",
    company_id: COMPANY_ID,
    title: "Cierre con financiación",
    category: "cotizacion",
    body: "{{nombre}}, podés llevarte {{producto}} con un anticipo de {{anticipo}} y cuotas de {{cuota}}. ¿Avanzamos con la reserva?",
    created_at: offset(-12),
  },
];

// ── Reglas de automatización (mock, estructura lista) ─────────
export const demoAutomationRules: AutomationRule[] = [
  { id: "auto_1", company_id: COMPANY_ID, name: "Recordatorio al crear lead", trigger: "lead_creado", action: "crear_recordatorio", active: true, created_at: offset(-40) },
  { id: "auto_2", company_id: COMPANY_ID, name: "Seguimiento 48h post-cotización", trigger: "lead_cotizado", action: "crear_tarea", active: true, created_at: offset(-40) },
  { id: "auto_3", company_id: COMPANY_ID, name: "Alerta si no hay respuesta", trigger: "sin_respuesta", action: "notificar", active: false, created_at: offset(-40) },
  { id: "auto_4", company_id: COMPANY_ID, name: "Pasar a negociación si acepta cotización", trigger: "cotizacion_aceptada", action: "cambiar_estado", active: true, created_at: offset(-40) },
  { id: "auto_5", company_id: COMPANY_ID, name: "Asignación automática por ronda", trigger: "lead_creado", action: "asignar_vendedor", active: false, created_at: offset(-40) },
  { id: "auto_6", company_id: COMPANY_ID, name: "Tarea urgente para lead caliente", trigger: "lead_caliente", action: "crear_tarea", active: true, created_at: offset(-40) },
];

// ── Scores IA (mock) ──────────────────────────────────────────
export const demoAiScores: AiLeadScore[] = demoLeads
  .filter((l) => ["caliente", "tibio"].includes(l.temperature) && !["vendido", "cerrado"].includes(l.status))
  .slice(0, 8)
  .map((l, i) => ({
    id: `score_${l.id}`,
    lead_id: l.id,
    score: [92, 88, 81, 76, 70, 64, 58, 53][i] ?? 60,
    classification: l.temperature,
    reasons: [
      "Respondió rápido en los últimos contactos.",
      "Pidió cotización formal.",
      l.product_interest ? `Interés concreto en ${l.product_interest}.` : "Producto definido.",
    ],
    recommended_action: pick([
      "Llamar hoy y ofrecer financiación.",
      "Enviar cotización con promo vigente.",
      "Agendar visita al showroom esta semana.",
      "Reforzar seguimiento por WhatsApp.",
    ]),
    created_at: offset(-(1 + i)),
  }));

export function buildSeedState(): DataState {
  return {
    company: demoCompany,
    users: demoUsers,
    clients: demoClients,
    leads: demoLeads,
    interactions: demoInteractions,
    products: demoProducts,
    tasks: demoTasks,
    quotes: demoQuotes,
    simulations: demoSimulations,
    sales: demoSales,
    goals: demoGoals,
    templates: demoTemplates,
    automationRules: demoAutomationRules,
    aiScores: demoAiScores,
    auditLog: [],
    remarketingRequests: [],
    leadDistribution: {
      mode: "round_robin",
      rr_pointer: 0,
      rules: [],
      fallback_user_id: null,
    },
  };
}

