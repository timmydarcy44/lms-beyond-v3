import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** accent = rouge EDGE ; muted = gris sur fond clair ; muted-dark = gris sur fond noir */
  tone?: "accent" | "muted" | "muted-dark";
};

export function SectionLabel({ children, className, tone = "accent" }: Props) {
  return (
    <p
      className={cn(
        "text-[10px] font-normal uppercase tracking-[0.2em]",
        tone === "accent" && "text-edge-red",
        tone === "muted" && "text-black/30",
        tone === "muted-dark" && "text-white/30",
        className,
      )}
    >
      {children}
    </p>
  );
}
