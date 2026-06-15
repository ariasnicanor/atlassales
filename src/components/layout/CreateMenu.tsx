import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CREATE_ACTIONS } from "@/lib/nav";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";

/** Menú de creación rápida disparado por el botón "+". */
export function CreateMenu({ trigger }: { trigger: ReactNode }) {
  const navigate = useNavigate();
  const { hasTier } = usePlan();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {CREATE_ACTIONS.map((a) => {
            const locked = !hasTier(a.tier);
            return (
              <button
                key={a.path}
                onClick={() => go(a.path)}
                className={cn(
                  "flex h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-colors hover:bg-accent",
                  locked && "opacity-80"
                )}
              >
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <a.icon className="size-5" />
                  {locked && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-muted">
                      <Lock className="size-2.5 text-muted-foreground" />
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Las opciones de Growth se desbloquean con el plan correspondiente.
        </p>
      </DialogContent>
    </Dialog>
  );
}
