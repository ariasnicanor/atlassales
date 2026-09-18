import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/commercial/ProductImage";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

/** Galería con foto principal, flechas y miniaturas. Carga diferida (solo links). */
export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[Math.min(index, Math.max(total - 1, 0))];
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <div>
      <div className="relative">
        <ProductImage src={current} alt={alt} className="h-64 w-full sm:h-80" />
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur">
              {Math.min(index, total - 1) + 1}/{total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === index ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              <ProductImage src={src} alt={`${alt} ${i + 1}`} className="h-16 w-24" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
