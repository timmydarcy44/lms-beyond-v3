import { cn } from "@/lib/utils";

type NevoWordmarkProps = {
  className?: string;
  /** Variante claire sur fond sombre */
  variant?: "dark" | "light";
};

const SF_PRO =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

/** Logo typographique officiel : nevo. (minuscules, point final, SF Pro Bold) */
export function NevoWordmark({ className, variant = "light" }: NevoWordmarkProps) {
  return (
    <span
      className={cn(
        "text-2xl font-bold tracking-tight md:text-3xl",
        variant === "light" ? "text-[#2F2A25]" : "text-white",
        className,
      )}
      style={{ fontFamily: SF_PRO }}
      aria-label="nevo."
    >
      nevo.
    </span>
  );
}
