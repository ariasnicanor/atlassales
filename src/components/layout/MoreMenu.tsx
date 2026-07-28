import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getProfileSections } from "@/lib/nav";
import { usePlan } from "@/hooks/usePlan";
import { useSession } from "@/context/session";

export function MoreMenu({ trigger }: { trigger: ReactNode }) {
  const navigate = useNavigate();
  const { hasModule } = usePlan();
  const { currentUser } = useSession();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groups = getProfileSections(currentUser);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Más opciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {groups.map((group) => {
            const items = group.items;
            if (items.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => {
                    const locked = !hasModule(item.moduleKey);
                    return (
                      <button
                        key={item.path}
                        onClick={() => go(item.path)}
                        className="flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <item.icon className="size-4 shrink-0 text-primary" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {locked && <Lock className="size-3.5 text-muted-foreground/70" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => go("/plans")}
            className="flex w-full items-center gap-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent2/10 p-3 transition-colors hover:from-primary/15 hover:to-accent2/15"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium leading-tight">Planes y módulos</p>
              <p className="truncate text-xs text-muted-foreground">Activá Growth, Automation e IA</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
