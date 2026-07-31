import { useNavigate } from "react-router-dom";
import { Moon, Sun, Plus, LogOut, Database, RotateCcw, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useSession } from "@/context/session";
import { useData } from "@/data/store";
import { DATA_MODE } from "@/lib/supabase/client";
import { roleLabel } from "@/lib/permissions";
import { CreateMenu } from "./CreateMenu";
import { NotificationsBell } from "./NotificationsBell";

export function Topbar() {
  const { currentUser, logout, theme, toggleTheme, loginAs } = useSession();
  const { users, company, resetDemo } = useData();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-2 overflow-hidden border-b bg-background/95 px-4 backdrop-blur">
      {/* Brand (solo mobile; en desktop está en el sidebar) */}
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Waves className="size-4" />
        </div>
        <span className="truncate text-sm font-semibold">{company.name}</span>
      </div>

      {DATA_MODE === "mock" && (
        <Badge variant="warning" className="ml-1 hidden shrink-0 sm:inline-flex">
          <Database className="size-3" /> Datos demo
        </Badge>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">

        <CreateMenu
          trigger={
            <Button size="sm" className="hidden sm:inline-flex">
              <Plus className="size-4" /> Crear
            </Button>
          }
        />
        <CreateMenu
          trigger={
            <Button size="icon" className="sm:hidden" aria-label="Crear">
              <Plus className="size-4" />
            </Button>
          }
        />

        <NotificationsBell />

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
          onChange={(e) => loginAs(e.target.value)}
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
