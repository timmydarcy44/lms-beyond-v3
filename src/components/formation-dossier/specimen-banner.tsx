import { SPECIMEN_BANNER_HINT, SPECIMEN_BANNER_LABEL } from "@/lib/formation-dossier/specimen";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Bandeau visible sur les écrans d’un dossier de démonstration. */
export function SpecimenBanner({ className, compact }: Props) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-rose-100",
        compact ? "rounded-md text-[11px]" : "rounded-xl text-sm",
        className,
      )}
    >
      <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        {SPECIMEN_BANNER_LABEL}
      </span>
      {!compact ? <span className="leading-snug">{SPECIMEN_BANNER_HINT}</span> : null}
    </div>
  );
}
