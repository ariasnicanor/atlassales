import { cn } from "@/lib/utils";

interface AtlasLogoProps {
  className?: string;
  title?: string;
}

export function AtlasLogo({ className, title = "Atlas" }: AtlasLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <path d="M50 6 96 92H73L50 48 27 92H4L50 6Z" fill="currentColor" />
      <path d="m50 63 16 29H34l16-29Z" className="fill-primary" />
    </svg>
  );
}