import { cn } from "@/lib/utils";

type Props = {
  quote: string;
  nom: string;
  parcours: string;
  date: string;
  accentAvatar?: boolean;
  variant?: "dark" | "light";
};

export function TestimonialBlock({
  quote,
  nom,
  parcours,
  date,
  accentAvatar = false,
  variant = "dark",
}: Props) {
  const initials = nom
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onLight = variant === "light";

  return (
    <blockquote className="flex flex-col gap-8">
      <p
        className={cn(
          "font-serif text-base italic leading-relaxed",
          onLight ? "text-edge-black/80" : "text-white/80",
        )}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <footer className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white",
            accentAvatar ? "bg-edge-red" : onLight ? "bg-edge-black" : "bg-[#222]",
          )}
          aria-hidden
        >
          {initials}
        </span>
        <div>
          <cite className={cn("not-italic text-sm font-medium", onLight ? "text-edge-black" : "text-white")}>
            {nom}
          </cite>
          <p className={cn("text-xs", onLight ? "text-black/40" : "text-white/45")}>
            {parcours} · {date}
          </p>
        </div>
      </footer>
    </blockquote>
  );
}
