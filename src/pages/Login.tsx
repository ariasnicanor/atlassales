import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Database, Loader2, Eye, EyeOff, UserRound, LockKeyhole, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { AtlasLogo } from "@/components/AtlasLogo";
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
    <main className="login-shell flex min-h-screen items-center justify-center p-0 sm:p-5 lg:p-8">
      <div className="flex min-h-screen w-full max-w-6xl overflow-hidden bg-card shadow-2xl sm:min-h-[min(740px,calc(100vh-2.5rem))] sm:rounded-[2rem]">
        <section className="flex w-full flex-col px-6 py-7 sm:px-10 sm:py-9 md:w-[44%] lg:w-[40%] lg:px-14">
          <div className="flex items-center gap-3 text-login-navy">
            <AtlasLogo className="size-9" />
            <div className="leading-none">
              <p className="font-heading text-base font-bold">Atlas</p>
              <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">Sales OS</p>
            </div>
          </div>

          <div className="my-auto w-full py-12">
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4 border-0">
                <Database className="size-3" /> Entorno demo
              </Badge>
              <h1 className="font-heading text-3xl font-semibold text-login-navy">Bienvenido</h1>
              <p className="mt-2 text-sm text-muted-foreground">Ingresá a {company.name}.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="DNI o correo" htmlFor="login-identity">
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                id="login-identity"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="h-12 rounded-full pl-11 pr-4"
              />
                </div>
              </Field>
              <Field label="Contraseña" htmlFor="login-password">
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-full pl-11 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="h-12 w-full rounded-full bg-login-navy font-semibold text-login-panel-foreground hover:bg-login-navy-soft" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Ingresar <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/register" className="text-primary hover:underline">
              Crear cuenta
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDemo((v) => !v)}
              className="h-10 gap-1 px-2 text-muted-foreground"
              aria-expanded={showDemo}
            >
              Perfiles demo <ChevronDown className={`size-4 transition-transform ${showDemo ? "rotate-180" : ""}`} />
            </Button>
          </div>

          <p className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">
            Contraseña para la demo:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">{DEMO_PASSWORD}</code>
          </p>

          {showDemo && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {featured.map((u) => (
                <Button
                  key={u.id}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    loginAs(u.id);
                    navigate("/dashboard");
                  }}
                  className="h-auto w-full justify-start rounded-lg px-3 py-2.5 text-left"
                >
                  <Avatar name={u.name} src={u.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{roleLabel(u.role)}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          )}
          </div>

          <p className="text-center text-xs text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Atlas Sales OS
          </p>
        </div>

        <section className="login-panel relative hidden flex-1 overflow-hidden md:flex">
          <div className="login-grid absolute inset-0 opacity-20" />
          <AtlasLogo className="absolute -right-16 top-1/2 size-[34rem] -translate-y-1/2 text-login-mark opacity-[0.08]" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12 lg:p-16">
            <div className="flex justify-end">
              <span className="rounded-full border border-login-panel-foreground/20 px-4 py-2 text-xs font-semibold text-login-panel-muted">
                Acceso seguro
              </span>
            </div>
            <div className="max-w-lg pb-8">
              <AtlasLogo className="mb-8 size-16 text-login-panel-foreground" />
              <h2 className="font-heading text-5xl font-semibold text-login-panel-foreground lg:text-6xl">Bienvenido<span className="text-primary">.</span></h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-login-panel-muted">
                Todo tu equipo comercial, en un solo lugar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
