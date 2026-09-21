# Deploy del servicio WhatsApp (Baileys) en Railway

El servicio corre como un proceso Node persistente. Baileys **no usa Chromium**,
así que funciona bien en Railway (a diferencia de OpenWA/whatsapp-web.js).

## Pasos (UI de Railway, ~10 min)

1. **New Project → Deploy from GitHub repo** → elegí `ariasnicanor/atlassales`.
2. Abrí el servicio creado → **Settings**:
   - **Root Directory**: `services/openwa`
   - (Start command y healthcheck ya vienen de `railway.json`.)
3. **Variables** (pestaña Variables):
   | Variable | Valor |
   |----------|-------|
   | `AUTH_TOKEN` | `atlas-demo-4f9c2a7e` (o el que quieras; tiene que coincidir con Vercel) |
   | `CORS_ORIGIN` | `*` (o `https://atlassales.vercel.app`) |
   | `WA_AUTH_DIR` | `/data` |
   > `PORT` lo inyecta Railway automáticamente — no la agregues.
4. **Volume** (para que la sesión de WhatsApp sobreviva a los redeploys):
   - En el servicio → **+ New → Volume** → Mount path: `/data`
5. Esperá el deploy (verde). Luego **Settings → Networking → Generate Domain**
   → te da algo como `https://atlassales-openwa-production.up.railway.app`.
6. Probá el healthcheck en el navegador: `https://<tu-dominio>/health`
   → debe responder `{"ok":true,...}`.

## Conectar el CRM (Vercel) a este servicio

En el proyecto `atlassales` de Vercel, actualizá la variable:
- `VITE_OPENWA_URL` = `https://<tu-dominio-railway>`
- (`VITE_WA_PROVIDER=openwa` y `VITE_OPENWA_TOKEN=atlas-demo-4f9c2a7e` ya están.)

Y hacé un **Redeploy** de producción (las `VITE_*` se inyectan en el build).

## Vincular el teléfono

Abrí `https://atlassales.vercel.app/whatsapp` → el banner mostrará el **QR**
→ escanealo desde WhatsApp → Dispositivos vinculados. Queda conectado y la
sesión persiste en el volumen.

## ⚠️ Avisos

- **Riesgo de baneo mayor desde la nube:** WhatsApp es más sensible a sesiones
  vinculadas desde IPs de datacenter (Railway) que desde una IP residencial.
  Usá un número que puedas permitirte perder. Si buscás algo sin riesgo para
  producción, es la WhatsApp Cloud API oficial (el proveedor `cloud-api`).
- Es una integración **no oficial**. Para el demo está perfecto; para vender a
  un cliente, migrar a `cloud-api`.
