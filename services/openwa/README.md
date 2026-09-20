# Microservicio OpenWA — Atlas Sales OS

Proceso Node **persistente** que mantiene una sesión de WhatsApp Web
(`@open-wa/wa-automate` + Chromium headless) y expone una API HTTP que el CRM
consume a través del proveedor `openwa`.

> ⚠️ **No se despliega en Cloudflare Workers.** Necesita un runtime Node
> long-running con Chromium: VPS, contenedor Docker, Railway, Render, Fly.io,
> o tu propia máquina para el demo.

## Levantarlo (demo)

```bash
cd services/openwa
cp .env.example .env      # ajustá PORT / CORS_ORIGIN si hace falta
npm install               # baja wa-automate + Chromium (~300 MB, tarda)
npm start
```

Al arrancar imprime un **QR en la consola** y también lo sirve en `/status`.
En el CRM, la sección WhatsApp muestra ese QR en un banner: escaneálo desde
**WhatsApp → Dispositivos vinculados → Vincular dispositivo**. Una vez
vinculado, el estado pasa a `connected` y los mensajes son reales.

## Conectar el CRM al servicio

En la raíz del proyecto (no en esta carpeta), creá un `.env`:

```bash
VITE_WA_PROVIDER=openwa
VITE_OPENWA_URL=http://localhost:3100
# VITE_OPENWA_TOKEN=...   # solo si definiste AUTH_TOKEN en el servicio
```

Reiniciá el dev server del CRM. También podés forzar el proveedor sin tocar el
`.env` desde la consola del navegador:

```js
localStorage.setItem("atlas-sales-os:wa-provider", "openwa"); location.reload();
// volver al demo simulado:
localStorage.setItem("atlas-sales-os:wa-provider", "mock");  location.reload();
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/status` | `{ state, qr, me }` — estado de conexión y QR pendiente |
| GET | `/chats` | Lista de conversaciones individuales |
| GET | `/chats/:id/messages` | Mensajes de un chat (`id` = teléfono, solo dígitos) |
| POST | `/send` | Body `{ chatId, text }` → envía y devuelve `SendResult` |
| GET | `/events?since=<epochMs>` | Mensajes entrantes nuevos desde ese timestamp |

## Notas de producción

- **Riesgo de baneo:** OpenWA automatiza WhatsApp Web de forma no oficial y
  viola los Términos de WhatsApp. Usá un número que puedas permitirte perder y
  evitá envíos masivos agresivos. Para producción, migrá al proveedor
  `cloud-api` (API oficial de Meta) — no requiere cambiar el CRM.
- **Sesión:** la carpeta de sesión que crea wa-automate guarda las credenciales;
  montala en un volumen persistente para no re-escanear el QR en cada deploy.
- **Estado en memoria:** este demo guarda los entrantes en RAM. Para producción,
  persistí en Supabase y reemplazá el buffer `inbound` + `/events` por webhooks.
