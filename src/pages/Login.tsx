import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Waves, ArrowRight, Check, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/session";
import { useData } from "@/data/store";
import { roleLabel } from "@/lib/permissions";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useSession();
  const { users, company } = useData();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = (id: string) => {
    login(id);
    navigate("/dashboard");
  };

  const featured = users.filter((u) => u.active).slice(0, 3);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand / pitch */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-accent2 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Waves className="size-6" />
          </div>
          <span className="text-lg font-semibold">Atlas Sales OS</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Menos tiempo cargando información.
            <br />
            Más tiempo vendiendo.
          </h1>
          <p className="max-w-md text-white/80">
            El sistema de gestión comercial pensado para vendedores. Leads,
            seguimiento, stock y cierres: rápido, simple y desde el celular.
          </p>
          <ul className="space-y-2 text-white/90">
            {[
              "Cargá un lead en menos de 20 segundos",
              "Seguí tus oportunidades sin perder ninguna",
              "WhatsApp, llamada y tareas en un toque",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-5" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-white/60">
          © {new Date().getFullYear()} Atlas Sales OS — Demo comercial
        </p>
      </div>

      {/* Right — login */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Badge variant="warning" className="mb-1">
              <Database className="size-3" /> Modo demo
            </Badge>
            <h2 className="text-2xl font-semibold">Ingresá a {company.name}</h2>
            <p className="text-sm text-muted-foreground">
              Elegí un perfil para entrar. Cada rol ve la plataforma distinto.
            </p>
          </div>

          <div className="space-y-3">
            {featured.map((u) => (
              <Card
                key={u.id}
                onClick={() => handleLogin(u.id)}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar name={u.name} src={u.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link to="/onboarding">Ver selección de empresa demo</Link>
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Esto es una demo con datos de ejemplo. No se requiere contraseña.
          </p>
        </div>
      </div>
    </div>
  );
}
