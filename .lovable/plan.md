## Objetivo

Reemplazar completamente la landing actual de Via Racer por el MVP **Surf Sales OS** del ZIP, manteniendo el stack actual del proyecto (TanStack Start + React 19 + Tailwind v4 + Vite 7), porque la plantilla del ZIP usa Vite 5 + React 18 + react-router-dom, que no son compatibles con esta plantilla.

## Alcance

1. **Limpieza**
   - Borrar `src/routes/index.tsx` (landing Via Racer) y los assets `src/assets/hero-pilotos.jpg`, `gallery-*.jpg`.
   - Restaurar `src/styles.css` a tokens neutros (dark/light) acordes a Surf Sales OS (azul océano + acentos).
   - Quitar fuentes Orbitron/Rajdhani de `__root.tsx`, poner Inter.

2. **Dependencias nuevas** (`bun add`)
   - `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `recharts`
   - Componentes Radix que falten ya están en shadcn local.

3. **Copia de código de dominio** (idéntico al ZIP, sin tocar lógica)
   - `src/types/index.ts`
   - `src/lib/`: `plans.ts`, `permissions.ts`, `validators.ts`, `labels.ts`, `nav.ts`, `date.ts`, `color.ts`, `contact.ts`, `supabase/client.ts`
   - `src/data/seed.ts`, `src/data/store.tsx`
   - `src/context/session.tsx`
   - `src/hooks/usePlan.ts`, `useMetrics.ts`, `useScopedData.ts`
   - `src/components/BrandingProvider.tsx`, `components/layout/*`, `components/commercial/*`, `components/forms/Field.tsx`
   - `supabase/schema.sql`, `supabase/seed.sql`, `docs/*`

4. **Adaptación de routing (Vite RR → TanStack Start)**
   - Reemplazar todos los `import { ... } from "react-router-dom"` por equivalentes de `@tanstack/react-router`:
     - `Link to` → `Link to`
     - `useNavigate()` → `useNavigate()` (API ligeramente distinta: `navigate({ to })`)
     - `useParams()` → `Route.useParams()` por archivo
     - `Outlet`, `Navigate` → equivalentes TSR
   - Crear archivos de ruta en `src/routes/` (flat dot-naming):
     - `login.tsx`, `onboarding.tsx`
     - Layout `_app.tsx` (envuelve con `AppLayout` + `<Outlet/>`)
     - Bajo `_app`: `_app.dashboard.tsx`, `_app.leads.tsx`, `_app.leads.new.tsx`, `_app.leads.$id.tsx`, `_app.leads.$id.edit.tsx`, `_app.clients.tsx`, `_app.clients.$id.tsx`, `_app.stock.tsx`, `_app.stock.$id.tsx`, `_app.tasks.tsx`, `_app.users.tsx`, `_app.reports.tsx`, `_app.settings.tsx`, `_app.growth.simulator.tsx`, `_app.growth.quoter.tsx`, `_app.growth.commissions.tsx`, `_app.growth.goals.tsx`, `_app.growth.ranking.tsx`, `_app.growth.templates.tsx`, `_app.automation.tsx`, `_app.ai-assist.tsx`, `_app.ai-agent.tsx`, `_app.plans.tsx`
   - `src/routes/index.tsx` → redirige a `/dashboard`.
   - Cada archivo de ruta importa el componente desde `src/features/<modulo>/<Page>.tsx` (copiado tal cual del ZIP, con imports ajustados).

5. **__root.tsx**
   - Mantener shell HTML/QueryClient.
   - Agregar `<SessionProvider>` y `<StoreProvider>` y `<BrandingProvider>` envolviendo el `<Outlet/>`.
   - Título: "Surf Sales OS — Menos tiempo cargando, más tiempo vendiendo".

6. **Variables de entorno**
   - Crear `.env.example` con `VITE_USE_MOCK_DATA=true`.
   - El cliente Supabase del ZIP usa `import.meta.env.VITE_SUPABASE_URL` y solo se instancia si están las claves — compatible.

7. **Estilos**
   - Reescribir `src/styles.css` (Tailwind v4) reproduciendo los tokens del `tailwind.config.ts` + `index.css` del ZIP (paleta océano, radios, animaciones).
   - No usar `tailwind.config.ts`; todo va en `@theme` de `styles.css`.

## Lo que NO se hace

- No se ejecuta `npm install` del ZIP — usamos las deps de este proyecto + las añadidas.
- No se copia `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js` del ZIP (incompatibles con Tailwind v4 + Vite 7 + TanStack Start).
- No se conecta a Supabase real (queda como mock por defecto). Si después se quiere, se habilita Lovable Cloud y migramos `src/lib/supabase/client.ts`.
- No se publica todavía.

## Notas técnicas

- TanStack Router exige que cada `<Link to="/x">` apunte a un archivo de ruta existente; por eso se crean **todas** las rutas en un solo lote antes de tocar componentes.
- `useNavigate` cambia: `navigate("/x")` → `navigate({ to: "/x" })`. Se hará search-replace masivo en los archivos copiados.
- `useParams<{ id: string }>()` se reemplaza por `const { id } = Route.useParams()` con el `Route` exportado por cada archivo TSR; las páginas se convierten en componentes que reciben `id` por prop para evitar acoplarlas al `Route`.
- Persistencia `localStorage` del store funciona igual en SSR si se guardan los accesos detrás de `typeof window !== "undefined"` (ya lo hace el ZIP).

## Validación

- Build pasa (`tsc` + Vite).
- `/` redirige a `/dashboard`, login funciona con perfiles demo, navegación lateral abre cada módulo sin 404.
