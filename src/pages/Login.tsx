import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Waves, ArrowRight, Check, Database, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { useSession } from "@/context/session";
import { useData } from "@/data/store";
import { roleLabel } from "@/lib/permissions";
import { DEMO_PASSWORD } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAs, isAuthenticated } = useSession();
  const { users, company } = useData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      navigate("/dashboard");
      return;
    }
    setError(
      res.reason === "not_found"
        ? "No encontramos una cuenta con ese email."
        : res.reason === "wrong_password"
        ? "La contraseña es incorrecta."
        : "La cuenta está inactiva. Contactá a un administrador."
    );
  }

  const featured = users.filter((u) => u.active).slice(0, 3);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand */}
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

      {/* Right — login form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Badge variant="warning" className="mb-1">
              <Database className="size-3" /> Modo demo
            </Badge>
            <h2 className="text-2xl font-semibold">Ingresá a {company.name}</h2>
            <p className="text-sm text-muted-foreground">
              Iniciá sesión con tu email y contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
              />
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Ingresar
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link to="/register" className="text-primary hover:underline">
              Crear cuenta
            </Link>
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showDemo ? "Ocultar" : "Ver"} perfiles demo
            </button>
          </div>

          <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            Demo: cualquier usuario ingresa con la contraseña{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">{DEMO_PASSWORD}</code>
          </p>

          {showDemo && (
            <div className="space-y-2">
              {featured.map((u) => (
                <Card
                  key={u.id}
                  onClick={() => {
                    loginAs(u.id);
                    navigate("/dashboard");
                  }}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar name={u.name} src={u.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
