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
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

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
export const demoUsers: User[] = (
  [
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
    // ── Cuentas reales de los dueños (no aparecen en "Perfiles demo",
    //    que muestra un solo usuario por rol; se ingresa con email + contraseña).
    {
      id: "user_nicanor",
      company_id: COMPANY_ID,
      name: "Nicanor Arias",
      email: "nicanor.arias@atlassales.com",
      role: "admin",
      avatar_url: null,
      active: true,
      created_at: offset(-10),
    },
    {
      id: "user_moises",
      company_id: COMPANY_ID,
      name: "Moises Fernández",
      email: "moises.fernandez@atlassales.com",
      role: "admin",
      avatar_url: null,
      active: true,
      created_at: offset(-10),
    },
  ] as User[]
).map((u, i) => ({
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
  email: `${name
    .toLowerCase()
    .replace(/[^a-z]/g, ".")
    .replace(/\.+/g, ".")}@mail.com`,
  company_name: companyNames[i % companyNames.length] || null,
  city: cities[i % cities.length],
  notes: i % 4 === 0 ? "Cliente recurrente. Prioridad alta." : null,
  created_at: offset(-(60 + i * 5)),
}));

// ── Productos (18 autos) ──────────────────────────────────────
// 0 km y usados, 3 por gama (baja / media / alta). La gama va en `category`
// para que el filtro de Stock permita, por ejemplo, "0 km" + "Gama alta".
type SeedProduct = Omit<Product, "id" | "company_id" | "created_at">;

// Fotos reales de cada modelo, de Wikimedia Commons (licencias CC: se muestra
// el crédito en el detalle del producto). Miniaturas de 960 px.
const commons = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`;
const PHOTO = {
  kwid: {
    url: commons(
      "7/77/2023_Renault_Kwid_Iconic_%28Colombia%29_front_view_01.png/960px-2023_Renault_Kwid_Iconic_%28Colombia%29_front_view_01.png",
    ),
    credit: "Autosdeprimera · CC BY 3.0 · Wikimedia Commons",
  },
  cronos: {
    url: commons(
      "f/fa/2024_Fiat_Cronos_1.3_GSE_Precision.jpg/960px-2024_Fiat_Cronos_1.3_GSE_Precision.jpg",
    ),
    credit: "Just a Man · CC BY 4.0 · Wikimedia Commons",
  },
  p208: {
    url: commons(
      "7/79/Peugeot_208_II_GT_Line_rouge_%28avant%29.jpg/960px-Peugeot_208_II_GT_Line_rouge_%28avant%29.jpg",
    ),
    credit: "Futurhit12 · CC BY-SA 4.0 · Wikimedia Commons",
  },
  corollaCross: {
    url: commons(
      "0/0c/2022_Toyota_Corolla_Cross_L_FWD%2C_Front_Left%2C_11-21-2021.jpg/960px-2022_Toyota_Corolla_Cross_L_FWD%2C_Front_Left%2C_11-21-2021.jpg",
    ),
    credit: "Elise240SX · CC BY-SA 4.0 · Wikimedia Commons",
  },
  taos: {
    url: commons(
      "7/76/2022_Volkswagen_Taos_Trendline_in_Pure_White%2C_front_left%2C_2024-07-10.jpg/960px-2022_Volkswagen_Taos_Trendline_in_Pure_White%2C_front_left%2C_2024-07-10.jpg",
    ),
    credit: "Elise240SX · CC BY-SA 4.0 · Wikimedia Commons",
  },
  ranger: {
    url: commons(
      "2/28/Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg/960px-Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg",
    ),
    credit: "Alexander-93 · CC BY-SA 4.0 · Wikimedia Commons",
  },
  sw4: {
    url: commons(
      "1/14/2021_Toyota_Fortuner_SRZ_2.7_4x2_%28Indonesia%29_front_view_01.jpg/960px-2021_Toyota_Fortuner_SRZ_2.7_4x2_%28Indonesia%29_front_view_01.jpg",
    ),
    credit: "Andra Febrian · CC BY-SA 4.0 · Wikimedia Commons",
  },
  x1: {
    url: commons("5/59/BMW_X1_%28U11%29_China.jpg/960px-BMW_X1_%28U11%29_China.jpg"),
    credit: "Dinkun Chen · CC BY-SA 4.0 · Wikimedia Commons",
  },
  gla: {
    url: commons(
      "1/1c/MERCEDES-BENZ_GLA_%28H247%29_China.jpg/960px-MERCEDES-BENZ_GLA_%28H247%29_China.jpg",
    ),
    credit: "Dinkun Chen · CC BY-SA 4.0 · Wikimedia Commons",
  },
  gol: {
    url: commons(
      "0/04/2015_Volkswagen_Gol_Trend_1.6_Pack_III%2C_I-Motion_%28front%29.jpg/960px-2015_Volkswagen_Gol_Trend_1.6_Pack_III%2C_I-Motion_%28front%29.jpg",
    ),
    credit: "Maxi-Napo-99 · CC BY 4.0 · Wikimedia Commons",
  },
  prisma: {
    url: commons(
      "5/51/Chevrolet_Prisma_1.4_LT_2017_%2833949371312%29.jpg/960px-Chevrolet_Prisma_1.4_LT_2017_%2833949371312%29.jpg",
    ),
    credit: "RL GNZLZ · CC BY-SA 2.0 · Wikimedia Commons",
  },
  ka: {
    url: commons("5/57/Ford_Ka_1.5_SE_2018.jpg/960px-Ford_Ka_1.5_SE_2018.jpg"),
    credit: "Pdamico2009 · CC BY-SA 4.0 · Wikimedia Commons",
  },
  corolla: {
    url: commons(
      "b/bc/Toyota_Corolla_sedan_E210_hydrid.jpg/960px-Toyota_Corolla_sedan_E210_hydrid.jpg",
    ),
    credit: "Mateusmatsuda · CC BY 4.0 · Wikimedia Commons",
  },
  kicks: {
    url: commons("5/51/NissanKicks-Carilo-06281.jpg/960px-NissanKicks-Carilo-06281.jpg"),
    credit: "Ezarate · CC BY-SA 4.0 · Wikimedia Commons",
  },
  tracker: {
    url: commons(
      "f/f0/Chevrolet_Tracker_2021_%28front%29.png/960px-Chevrolet_Tracker_2021_%28front%29.png",
    ),
    credit: "Autosdeprimera · CC BY 3.0 · Wikimedia Commons",
  },
  amarok: {
    url: commons(
      "8/83/Volkswagen_Amarok_V6_Extreme_4Motion_2021.jpg/960px-Volkswagen_Amarok_V6_Extreme_4Motion_2021.jpg",
    ),
    credit: "RL GNZLZ · CC BY-SA 2.0 · Wikimedia Commons",
  },
  hilux: {
    url: commons(
      "3/36/Toyota_Hilux_SRV_2.8_TD_2023_%2854286671377%29_%28cropped%29.jpg/960px-Toyota_Hilux_SRV_2.8_TD_2023_%2854286671377%29_%28cropped%29.jpg",
    ),
    credit: "RL GNZLZ · CC BY-SA 2.0 · Wikimedia Commons",
  },
  bmw320: {
    url: commons(
      "7/73/BMW_G20_320i_Luxury_Line_Alpine_White_%282%29.jpg/960px-BMW_G20_320i_Luxury_Line_Alpine_White_%282%29.jpg",
    ),
    credit: "Damian B Oh · CC BY-SA 4.0 · Wikimedia Commons",
  },
};

type Photo = (typeof PHOTO)[keyof typeof PHOTO];
const photo = (p: Photo) => ({ images: [p.url], image_url: p.url, image_credit: p.credit });

const productSeeds: SeedProduct[] = [
  // ── 0 km · Gama baja ──
  {
    name: "Renault Kwid Iconic",
    brand: "Renault",
    category: "Gama baja",
    condition: "nuevo",
    version: "Iconic 1.0 SCe",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 26900000,
    promo_price: null,
    availability: 6,
    status: "disponible",
    description: "El 0 km más accesible del salón. Ideal primer auto o ciudad.",
    ...photo(PHOTO.kwid),
    internal_notes: "Entrada de gama: buen gancho para financiación.",
  },
  {
    name: "Fiat Cronos Drive",
    brand: "Fiat",
    category: "Gama baja",
    condition: "nuevo",
    version: "Drive 1.3 GSE",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 31500000,
    promo_price: 30200000,
    availability: 5,
    status: "disponible",
    description: "Sedán con el baúl más grande del segmento. Uno de los más vendidos del país.",
    ...photo(PHOTO.cronos),
    internal_notes: null,
  },
  {
    name: "Peugeot 208 Allure",
    brand: "Peugeot",
    category: "Gama baja",
    condition: "nuevo",
    version: "Allure 1.6",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 34900000,
    promo_price: null,
    availability: 4,
    status: "disponible",
    description: "Hatchback de diseño, i-Cockpit y pantalla táctil de 10''.",
    ...photo(PHOTO.p208),
    internal_notes: null,
  },
  // ── 0 km · Gama media ──
  {
    name: "Toyota Corolla Cross XEI Hybrid",
    brand: "Toyota",
    category: "Gama media",
    condition: "nuevo",
    version: "XEI 2.0 Hybrid",
    year: 2026,
    mileage_km: null,
    fuel: "Híbrido",
    transmission: "CVT",
    list_price: 49900000,
    promo_price: null,
    availability: 3,
    status: "disponible",
    description: "SUV híbrido, bajo consumo y Toyota Safety Sense.",
    ...photo(PHOTO.corollaCross),
    internal_notes: "Lista de espera corta: confirmar asignación con fábrica.",
  },
  {
    name: "Volkswagen Taos Highline",
    brand: "Volkswagen",
    category: "Gama media",
    condition: "nuevo",
    version: "Highline 1.4 TSI",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Automática",
    list_price: 52500000,
    promo_price: 50900000,
    availability: 4,
    status: "disponible",
    description: "SUV compacta con techo panorámico y tablero digital.",
    ...photo(PHOTO.taos),
    internal_notes: null,
  },
  {
    name: "Ford Ranger XLT 4x4",
    brand: "Ford",
    category: "Gama media",
    condition: "nuevo",
    version: "XLT 2.0 BiTurbo 4x4 AT",
    year: 2026,
    mileage_km: null,
    fuel: "Diésel",
    transmission: "Automática",
    list_price: 63800000,
    promo_price: null,
    availability: 2,
    status: "disponible",
    description: "Pickup de nueva generación, 4x4 con caja automática de 10 marchas.",
    ...photo(PHOTO.ranger),
    internal_notes: "Alta demanda en campo: priorizar leads del interior.",
  },
  // ── 0 km · Gama alta ──
  {
    name: "Toyota SW4 SRX",
    brand: "Toyota",
    category: "Gama alta",
    condition: "nuevo",
    version: "SRX 2.8 TDI 4x4 AT · 7 asientos",
    year: 2026,
    mileage_km: null,
    fuel: "Diésel",
    transmission: "Automática",
    list_price: 98500000,
    promo_price: null,
    availability: 2,
    status: "disponible",
    description: "SUV 4x4 de 7 asientos, cuero y techo solar.",
    ...photo(PHOTO.sw4),
    internal_notes: null,
  },
  {
    name: "BMW X1 sDrive20i",
    brand: "BMW",
    category: "Gama alta",
    condition: "nuevo",
    version: "sDrive20i xLine",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Automática",
    list_price: 112000000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "SUV premium con pantalla curva y asistente de estacionamiento.",
    ...photo(PHOTO.x1),
    internal_notes: "Unidad de exhibición: permite test drive.",
  },
  {
    name: "Mercedes-Benz GLA 200",
    brand: "Mercedes-Benz",
    category: "Gama alta",
    condition: "nuevo",
    version: "GLA 200 Progressive",
    year: 2026,
    mileage_km: null,
    fuel: "Nafta",
    transmission: "Automática",
    list_price: 104000000,
    promo_price: 99800000,
    availability: 1,
    status: "disponible",
    description: "SUV compacto premium con MBUX y luces LED High Performance.",
    ...photo(PHOTO.gla),
    internal_notes: null,
  },
  // ── Usados · Gama baja ──
  {
    name: "Volkswagen Gol Trend",
    brand: "Volkswagen",
    category: "Gama baja",
    condition: "usado",
    version: "Trend 1.6 Highline 5p",
    year: 2016,
    mileage_km: 98000,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 11200000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "Impecable, service al día, cubiertas nuevas. Recibimos tu usado.",
    ...photo(PHOTO.gol),
    internal_notes: "Tomado en parte de pago.",
  },
  {
    name: "Chevrolet Prisma LT",
    brand: "Chevrolet",
    category: "Gama baja",
    condition: "usado",
    version: "LT 1.4",
    year: 2017,
    mileage_km: 86000,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 12900000,
    promo_price: null,
    availability: 0,
    status: "vendido",
    description: "Sedán económico, segundo dueño, aire y dirección asistida.",
    ...photo(PHOTO.prisma),
    internal_notes: "Vendido la semana pasada.",
  },
  {
    name: "Ford Ka SE",
    brand: "Ford",
    category: "Gama baja",
    condition: "usado",
    version: "SE 1.5 5p",
    year: 2018,
    mileage_km: 72000,
    fuel: "Nafta",
    transmission: "Manual",
    list_price: 14300000,
    promo_price: 13800000,
    availability: 1,
    status: "disponible",
    description: "Único dueño, pantalla SYNC y control de estabilidad.",
    ...photo(PHOTO.ka),
    internal_notes: null,
  },
  // ── Usados · Gama media ──
  {
    name: "Toyota Corolla XEI",
    brand: "Toyota",
    category: "Gama media",
    condition: "usado",
    version: "XEI 1.8 CVT",
    year: 2020,
    mileage_km: 64000,
    fuel: "Nafta",
    transmission: "CVT",
    list_price: 28900000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "Service oficial Toyota, único dueño. Muy buen estado.",
    ...photo(PHOTO.corolla),
    internal_notes: null,
  },
  {
    name: "Nissan Kicks Exclusive",
    brand: "Nissan",
    category: "Gama media",
    condition: "usado",
    version: "Exclusive 1.6 CVT",
    year: 2019,
    mileage_km: 109000,
    fuel: "Nafta",
    transmission: "CVT",
    list_price: 23900000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "Tope de gama, cámara 360° y techo bitono.",
    ...photo(PHOTO.kicks),
    internal_notes: "Tomado en parte de pago. Margen bueno.",
  },
  {
    name: "Chevrolet Tracker LTZ",
    brand: "Chevrolet",
    category: "Gama media",
    condition: "usado",
    version: "LTZ 1.2 Turbo AT",
    year: 2022,
    mileage_km: 45000,
    fuel: "Nafta",
    transmission: "Automática",
    list_price: 31800000,
    promo_price: 30900000,
    availability: 1,
    status: "disponible",
    description: "SUV urbana, impecable, garantía de fábrica vigente.",
    ...photo(PHOTO.tracker),
    internal_notes: null,
  },
  // ── Usados · Gama alta ──
  {
    name: "Volkswagen Amarok V6 Extreme",
    brand: "Volkswagen",
    category: "Gama alta",
    condition: "usado",
    version: "V6 3.0 TDI Extreme 4Motion",
    year: 2021,
    mileage_km: 78000,
    fuel: "Diésel",
    transmission: "Automática",
    list_price: 52500000,
    promo_price: null,
    availability: 1,
    status: "reservado",
    description: "Pickup V6, muy cuidada, cubiertas nuevas y cuero.",
    ...photo(PHOTO.amarok),
    internal_notes: "Reservada con seña.",
  },
  {
    name: "Toyota Hilux SRV",
    brand: "Toyota",
    category: "Gama alta",
    condition: "usado",
    version: "SRV 2.8 TDI 4x4 AT",
    year: 2021,
    mileage_km: 70000,
    fuel: "Diésel",
    transmission: "Automática",
    list_price: 46900000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "Service oficial, cubre caja y cubiertas nuevas.",
    ...photo(PHOTO.hilux),
    internal_notes: "Unidad de mayor rotación.",
  },
  {
    name: "BMW 320i Sportline",
    brand: "BMW",
    category: "Gama alta",
    condition: "usado",
    version: "320i Sportline 2.0 Turbo",
    year: 2019,
    mileage_km: 58000,
    fuel: "Nafta",
    transmission: "Automática",
    list_price: 41500000,
    promo_price: null,
    availability: 1,
    status: "disponible",
    description: "Sedán premium, historial de service oficial completo.",
    ...photo(PHOTO.bmw320),
    internal_notes: null,
  },
];

export const demoProducts: Product[] = productSeeds.map((p, i) => ({
  id: `prod_${i + 1}`,
  company_id: COMPANY_ID,
  created_at: offset(-(90 - i)),
  ...p,
}));

// ── Leads (30) ────────────────────────────────────────────────
const leadFirst = [
  "Marcelo",
  "Romina",
  "Cristian",
  "Natalia",
  "Gabriel",
  "Yamila",
  "Leandro",
  "Brenda",
  "Emanuel",
  "Antonella",
  "Damián",
  "Micaela",
  "Ezequiel",
  "Rocío",
  "Franco",
  "Belén",
  "Iván",
  "Tamara",
  "Lautaro",
  "Melina",
  "Joaquín",
  "Aldana",
  "Tomás",
  "Carla",
  "Bruno",
  "Jesica",
  "Matías",
  "Noelia",
  "Alan",
  "Sabrina",
];
const leadLast = [
  "Giménez",
  "Romero",
  "Suárez",
  "Ortega",
  "Vidal",
  "Cáceres",
  "Maldonado",
  "Benítez",
  "Figueroa",
  "Villalba",
  "Correa",
  "Ojeda",
  "Barrios",
  "Peralta",
];
const sources = [
  "Web",
  "WhatsApp",
  "Referido",
  "Instagram",
  "Showroom",
  "Campaña Meta",
  "Llamada entrante",
  "Mercado Libre",
];
const statuses: LeadStatus[] = [
  "nuevo",
  "contactado",
  "en_negociacion",
  "proximo_a_vender",
  "vendido",
  "sin_gestion",
  "cerrado",
];
const temps: Temperature[] = ["frio", "tibio", "caliente"];

// Distribución pensada para que el dashboard se vea activo con el nuevo pipeline.
const statusPlan: LeadStatus[] = [
  "nuevo",
  "nuevo",
  "nuevo",
  "nuevo",
  "nuevo",
  "contactado",
  "contactado",
  "contactado",
  "contactado",
  "en_negociacion",
  "en_negociacion",
  "en_negociacion",
  "en_negociacion",
  "en_negociacion",
  "proximo_a_vender",
  "proximo_a_vender",
  "proximo_a_vender",
  "proximo_a_vender",
  "vendido",
  "vendido",
  "vendido",
  "vendido",
  "sin_gestion",
  "sin_gestion",
  "sin_gestion",
  "cerrado",
  "cerrado",
  "en_negociacion",
  "contactado",
  "nuevo",
];

// Días sin gestión pensados para mostrar los 3 niveles de indicador (verde/amarillo/rojo).
const managementAgePlan: number[] = [
  0,
  1,
  2,
  3,
  4,
  1,
  3,
  6,
  8,
  2,
  5,
  9,
  12,
  15,
  1,
  3,
  10,
  18,
  0,
  4,
  7,
  12,
  22,
  25,
  28, // sin gestión → cerca del auto-cierre
  35,
  45, // ya cerrados
  6,
  11,
  2,
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
  const nextContact = open ? offset(pick([-4, -2, -1, 0, 1, 2, 3, 5])) : null;
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
    financing_summary: i % 2 === 0 ? "Anticipo 40% + 12 cuotas fijas" : null,
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
  const payment = Math.round((financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term)));
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
  {
    id: "auto_1",
    company_id: COMPANY_ID,
    name: "Recordatorio al crear lead",
    trigger: "lead_creado",
    action: "crear_recordatorio",
    active: true,
    created_at: offset(-40),
  },
  {
    id: "auto_2",
    company_id: COMPANY_ID,
    name: "Seguimiento 48h post-cotización",
    trigger: "lead_cotizado",
    action: "crear_tarea",
    active: true,
    created_at: offset(-40),
  },
  {
    id: "auto_3",
    company_id: COMPANY_ID,
    name: "Alerta si no hay respuesta",
    trigger: "sin_respuesta",
    action: "notificar",
    active: false,
    created_at: offset(-40),
  },
  {
    id: "auto_4",
    company_id: COMPANY_ID,
    name: "Pasar a negociación si acepta cotización",
    trigger: "cotizacion_aceptada",
    action: "cambiar_estado",
    active: true,
    created_at: offset(-40),
  },
  {
    id: "auto_5",
    company_id: COMPANY_ID,
    name: "Asignación automática por ronda",
    trigger: "lead_creado",
    action: "asignar_vendedor",
    active: false,
    created_at: offset(-40),
  },
  {
    id: "auto_6",
    company_id: COMPANY_ID,
    name: "Tarea urgente para lead caliente",
    trigger: "lead_caliente",
    action: "crear_tarea",
    active: true,
    created_at: offset(-40),
  },
];

// ── Scores IA (mock) ──────────────────────────────────────────
export const demoAiScores: AiLeadScore[] = demoLeads
  .filter(
    (l) =>
      ["caliente", "tibio"].includes(l.temperature) && !["vendido", "cerrado"].includes(l.status),
  )
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
    reservationRequests: [],
    saleConfirmations: [],
    leadDistribution: {
      mode: "round_robin",
      rr_pointer: 0,
      rules: [],
      fallback_user_id: null,
    },
  };
}
