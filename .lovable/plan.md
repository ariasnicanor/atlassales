## Alcance (según respuestas)

- Se mantiene el modo demo (localStorage, sin backend real).
- Login con **email + contraseña** (sin DNI).
- Roles: **vendedor, supervisor, admin** ya existentes, más sólidos. Superadmin queda para otra etapa.
- Este entregable se enfoca en **auth + roles + permisos + visibilidad + auditoría**. Pulido mobile-first en la siguiente iteración.

## Cambios

### 1. Auth con email + contraseña (demo)
- Extender `User` con `password_hash` (hash simple client-side, es solo demo).
- Sembrar contraseña única para todos los usuarios demo: `demo1234` (mostrada como hint en el login).
- Rehacer `src/pages/Login.tsx`: formulario email + contraseña + link a "Crear cuenta". Mantener el selector rápido de perfiles demo como atajo colapsable.
- Agregar `src/pages/Register.tsx`: alta de usuario con nombre, email, contraseña; rol por defecto `vendedor`.
- `session.tsx`: `login(email, password)` valida credencial; guarda `userId` en localStorage como hoy.

### 2. Relación supervisor → vendedores
- Nuevo campo `supervisor_id: UUID | null` en `User`.
- Seed: asignar los 5 vendedores a `Carolina Ruiz` (supervisor).
- Nueva pantalla admin en `src/pages/Users.tsx` para editar el supervisor de cada vendedor (los admins ya editan usuarios ahí).

### 3. Visibilidad de datos por rol
Reescribir `useScopedData`:
- **admin** → todo.
- **supervisor** → solo datos cuyo `assigned_user_id` / `user_id` sea uno de sus vendedores asignados (o él mismo).
- **vendedor** → solo lo propio (como hoy).
Aplicar el mismo criterio a `leads`, `tasks`, `quotes`, `sales`, `interactions`, `simulations`.

### 4. Matriz de permisos granular
Ampliar `src/lib/permissions.ts`:
- Nuevo tipo `Action = "view" | "create" | "edit" | "delete" | "assign" | "reassign" | "approve" | "export" | "manage"`.
- Nuevo tipo `Resource = "leads" | "clients" | "products" | "stock" | "prices" | "quotes" | "financing" | "tasks" | "goals" | "commissions" | "users" | "reports" | "dashboard" | "crm_config" | "sources" | "settings" | "audit"`.
- `ROLE_MATRIX: Record<UserRole, Partial<Record<Resource, Action[]>>>` con los defaults por rol descritos en el pedido.
- Nueva función `can(user, action, resource)` (retrocompatible con el `can(user, permission)` legacy vía overload).
- Overrides opcionales por usuario: `User.permission_overrides?: Partial<Record<Resource, Action[]>>`. Se aplican encima del rol.
- Reemplazar los llamados existentes de `can(user, "view_all_leads")` etc. por los nuevos (`can(user, "view", "leads")` con lógica de scope en `useScopedData`).

### 5. Auditoría
- Nuevo tipo `AuditLogEntry { id, user_id, action, resource, resource_id?, meta?, created_at }`.
- Agregar `auditLog: AuditLogEntry[]` en `DataState`.
- Envolver mutaciones en `store.tsx` (create/update/delete de leads, clientes, productos, tareas, cotizaciones, usuarios) para registrar entradas automáticamente con el `currentUser`.
- Nueva página `src/pages/Audit.tsx` (solo admin): tabla con filtros por usuario/recurso/fecha, exportable a CSV.
- Entrada en el menú visible solo si `can(user, "view", "audit")`.

### 6. Aplicación de permisos en la UI
- Ocultar/deshabilitar botones "Crear", "Editar", "Eliminar", "Asignar", "Exportar" según `can(...)`.
- El sidebar / bottom-nav filtra ítems por permisos.
- Rutas protegidas: componente `<RequirePermission action resource>` que redirige a `/dashboard` si falta.

### 7. Sin cambios mayores de layout
- No se rehace la navegación mobile-first en esta iteración (queda para la siguiente).
- Sí se mantienen los componentes actuales funcionando en las pantallas afectadas (Login, Register, Users, Audit).

## Detalles técnicos

- Todo sigue en `localStorage` bajo la clave `atlas-sales-os:data:v1`. Bump a `v2` para forzar re-seed y evitar romper con la nueva forma de `User`.
- Hash de contraseña: `SubtleCrypto.digest("SHA-256", pwd)` en hex. Suficiente para demo; se documenta en comentario que **no** es seguridad real.
- No se toca Supabase ni RLS (modo demo).
- Tipos actualizados en `src/types/index.ts`. Validadores de Zod actualizados en `src/lib/validators.ts` para el signup.

## Fuera de alcance (para siguientes iteraciones)

- Migración a Lovable Cloud / Supabase con auth real y RLS.
- Superadministrador multi-organización y editor visual de roles.
- Login por DNI.
- Rediseño mobile-first completo (nav, tipografía, gestos).
