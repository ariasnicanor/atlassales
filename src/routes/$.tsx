import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const App = lazy(() => import("@/App"));

export const Route = createFileRoute("/$")({
  ssr: false,
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
