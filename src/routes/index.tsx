import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const App = lazy(() => import("@/App"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar | Atlas Sales OS" },
      { name: "description", content: "Acceso a Atlas Sales OS, la plataforma de gestión comercial de tu equipo." },
      { property: "og:title", content: "Ingresar | Atlas Sales OS" },
      { property: "og:description", content: "Accedé a la plataforma de gestión comercial Atlas Sales OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppHost,
});

function AppHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}
