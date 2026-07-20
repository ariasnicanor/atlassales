import { useNavigate, Link } from "react-router-dom";
import { Waves, ArrowRight, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { PLAN_BY_TIER } from "@/lib/plans";

export default function Onboarding() {
  const navigate = useNavigate();
  const { company, users } = useData();
  const { login } = useSession();

  const admin = users.find((u) => u.role === "admin") ?? users[0];

  const enter = () => {
    login(admin.id);
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="size-6" />
          </div>
          <span className="text-lg font-semibold">Atlas Sales OS</span>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1 text-center">
              <Badge variant="secondary">Onboarding · Empresa demo</Badge>
              <h1 className="text-2xl font-semibold">Seleccioná tu empresa</h1>
              <p className="text-sm text-muted-foreground">
                En la versión real, acá conectás tu empresa y tu equipo. Para la
                demo ya cargamos una empresa de ejemplo con actividad realista.
              </p>
            </div>

            <button
              onClick={enter}
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-shadow hover:shadow-md"
            >
              <div
                className="flex size-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: company.primary_color }}
              >
                <Building2 className="size-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-muted-foreground">
                  {company.industry} · {users.length} usuarios
                </p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground" />
            </button>

            <div className="rounded-lg bg-muted/60 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-primary" /> Planes activos en la demo
              </p>
              <div className="flex flex-wrap gap-2">
                {company.active_plans.map((tier) => (
                  <Badge key={tier} variant="success">
                    {PLAN_BY_TIER[tier].name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={enter} className="w-full" size="lg">
              Entrar a la demo <ArrowRight className="size-4" />
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/login">Elegir otro perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
