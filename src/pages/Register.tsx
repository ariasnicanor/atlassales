import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Waves, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/Field";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/session";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Ingresá tu nombre.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== password2) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    const res = await register({ name, email, password });
    setLoading(false);
    if (res.ok) {
      navigate("/dashboard");
    } else {
      setError("Ya existe una cuenta con ese email.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="size-5" />
          </div>
          <span className="text-lg font-semibold">Atlas Sales OS</span>
        </div>

        <div className="space-y-1">
          <Badge variant="warning" className="mb-1">Modo demo</Badge>
          <h1 className="text-2xl font-semibold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Se creará un usuario con rol <strong>Vendedor</strong>. Un admin puede
            modificar el rol después.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nombre completo">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Contraseña">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Repetir contraseña">
            <Input type="password" required value={password2} onChange={(e) => setPassword2(e.target.value)} />
          </Field>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} Crear cuenta
          </Button>
        </form>

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Volver al login
        </Link>
      </div>
    </div>
  );
}
