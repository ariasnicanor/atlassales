import { Link } from "react-router-dom";
import { Waves, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Waves className="size-7" />
      </div>
      <h1 className="text-5xl font-bold">404</h1>
      <p className="max-w-sm text-muted-foreground">
        Esta ola no existe 🌊. La página que buscás no está disponible.
      </p>
      <Button asChild>
        <Link to="/dashboard"><Home className="size-4" /> Volver al inicio</Link>
      </Button>
    </div>
  );
}
