import { NavLink, Link } from "react-router-dom";
import { Lock, Waves, Sparkles } from "lucide-react";
import { getProfileSections } from "@/lib/nav";
import { useData } from "@/data/store";
import { usePlan } from "@/hooks/usePlan";
import { useSession } from "@/context/session";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { company } = useData();
  const { hasModule } = usePlan();
  const { currentUser } = useSession();

  const sections = getProfileSections(currentUser);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Waves className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{company.name}</p>
          <p className="truncate text-xs text-muted-foreground">Atlas Sales OS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const unlocked = hasModule(item.moduleKey);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {!unlocked && <Lock className="size-3.5 text-muted-foreground/70" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade CTA */}
      <div className="border-t p-3">
        <Link
          to="/plans"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent2/10 p-3 transition-colors hover:from-primary/15 hover:to-accent2/15"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">Planes y módulos</p>
            <p className="truncate text-xs text-muted-foreground">Potenciá tu equipo</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
