import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/landing/Landing";

// La landing se renderiza en el servidor (rápida y legible para Google).
// El CRM sigue entrando por el catch-all `$.tsx` (/login, /dashboard, …).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas Sales OS — El CRM para concesionarias" },
      {
        name: "description",
        content:
          "WhatsApp oficial, leads, stock y cotizaciones en un solo lugar. El CRM para concesionarias y agencias de autos: menos tiempo cargando, más tiempo vendiendo.",
      },
      { property: "og:title", content: "Atlas Sales OS — El CRM para concesionarias" },
      {
        property: "og:description",
        content: "WhatsApp oficial, leads, stock y cotizaciones en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
