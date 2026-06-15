import { useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, Plus, LogOut, Database, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useSession } from "@/context/session";
import { useData } from "@/data/store";
import { DATA_MODE } from "@/lib/supabase/client";
import { roleLabel } from "@/lib/permissions";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const { currentUser, logout, theme, toggleTheme, login } = useSession();
  const { users, resetDemo } = useData();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Menú">
        <Menu className="size-5" />
      </Button>

      {DATA_MODE === "mock" && (
        <Badge variant="warning" className="hidden sm:inline-flex">
          <Database className="size-3" /> Datos demo
        </Badge>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" onClick={() => navigate("/leads/new")} className="hidden sm:inline-flex">
          <Plus className="size-4" /> Nuevo lead
        </Button>
        <Button size="icon" variant="default" onClick={() => navigate("/leads/new")} className="sm:hidden" aria-label="Nuevo lead">
          <Plus className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm("¿Restablecer todos los datos demo a su estado original?")) resetDemo();
          }}
          aria-label="Reiniciar demo"
          title="Reiniciar datos demo"
          className="hidden sm:inline-flex"
        >
          <RotateCcw className="size-5" />
        </Button>

        {/* Demo: cambiar de usuario para ver permisos por rol */}
        <Select
          value={currentUser?.id ?? ""}
          onChange={(e) => login(e.target.value)}
          className="hidden w-44 md:block"
          aria-label="Cambiar usuario (demo)"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {roleLabel(u.role)}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-2">
          <Avatar name={currentUser?.name ?? "?"} src={currentUser?.avatar_url} size="sm" />
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">
              {currentUser ? roleLabel(currentUser.role) : ""}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} aria-label="Salir">
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}
