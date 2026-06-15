import { NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { PRIMARY_NAV } from "@/lib/nav";
import { MoreMenu } from "./MoreMenu";
import { cn } from "@/lib/utils";

/** Barra de navegación inferior fija para mobile/tablet (oculta en desktop). */
export function BottomNav() {
  const itemClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground"
    );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-stretch">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => itemClass(isActive)}>
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-5", isActive && "fill-primary/10")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <MoreMenu
          trigger={
            <button className={itemClass(false)}>
              <MoreHorizontal className="size-5" />
              <span>Más</span>
            </button>
          }
        />
      </div>
    </nav>
  );
}
