import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/** Imagen de producto con fallback (gradiente + icono) si no hay/no carga. */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [error, setError] = useState(false);
  const show = src && !error;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {show ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent2/10">
          <Package className="size-10 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
