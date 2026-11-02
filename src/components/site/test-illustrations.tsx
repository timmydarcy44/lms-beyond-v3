import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  screen = "#0B0C10",
}: {
  children: React.ReactNode;
  className?: string;
  screen?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[52px] shadow-[0_40px_90px_#00000099] ring-1 ring-white/15",
        className,
      )}
      style={{ background: screen }}
    >
      <div aria-hidden className="absolute left-1/2 top-3 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
      <div className="flex h-full flex-col px-4 pb-5 pt-11">{children}</div>
    </div>
  );
}

export function SoftSkillsPreview({
  title,
  rows,
  next,
  dot = "#B9AFFF",
  compact = false,
  showTitle = true,
}: {
  title: string;
  rows: { label: string; filled: number }[];
  next?: { kicker: string; title: string };
  dot?: string;
  compact?: boolean;
  showTitle?: boolean;
}) {
  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      {showTitle ? <p className={cn("font-extrabold text-white", compact ? "text-[13px]" : "text-[15px]")}>{title}</p> : null}
      <ol className={compact ? "grid gap-1.5" : "grid gap-2.5"}>
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2">
            <span className="w-4 text-[11px] font-extrabold text-white/45">{index + 1}</span>
            <span className={cn("min-w-0 flex-1 truncate font-bold text-white", compact ? "text-[12px]" : "text-[14px]")}>{row.label}</span>
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: 5 }, (_, dotIndex) => (
                <span
                  key={dotIndex}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: dotIndex < row.filled ? dot : "rgba(255,255,255,0.16)" }}
                />
              ))}
            </span>
          </li>
        ))}
      </ol>
      {next ? (
        <div className="rounded-2xl bg-[#6E5BFF] px-3 py-2.5 text-white">
          <p className="text-[11px] font-bold text-white/80">{next.kicker}</p>
          <p className="text-[13px] font-extrabold">{next.title}</p>
        </div>
      ) : null}
    </div>
  );
}

export function IdmcPreview({
  rows,
  compact = false,
  layout = "stack",
}: {
  rows: { name: string; hint?: string; filled: number; level: string; levelColor: string }[];
  compact?: boolean;
  layout?: "stack" | "inline";
}) {
  if (layout === "inline") {
    return (
      <ul className="grid gap-1.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2">
            <span className="w-[42%] truncate text-[10px] font-bold text-white">{row.name}</span>
            <span className="flex w-14 gap-0.5" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: index < row.filled ? row.levelColor : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-[9px] font-bold" style={{ color: row.levelColor }}>
              {row.level}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={compact ? "grid gap-2" : "grid gap-3"}>
      {rows.map((row) => (
        <li key={row.name}>
          <div className="flex items-center justify-between gap-3">
            <p className={cn("font-extrabold text-white", compact ? "text-[12px]" : "text-[14px]")}>{row.name}</p>
            <p className="shrink-0 text-[12px] font-extrabold" style={{ color: row.levelColor }}>{row.level}</p>
          </div>
          {row.hint && !compact ? <p className="mt-0.5 text-[12px] text-white/60">{row.hint}</p> : null}
          <span className="mt-1.5 flex gap-1" aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
              <span
                key={index}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: index < row.filled ? row.levelColor : "rgba(255,255,255,0.14)" }}
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

const QUADRANT = {
  dominant: "bg-[#5EDCC3] text-[#06221E]",
  secondary: "bg-[#5EDCC340] text-white",
  idle: "bg-white/10 text-white/75",
} as const;

export function BehaviorQuadrant({
  cells,
  large = false,
}: {
  cells: { label: string; tone: keyof typeof QUADRANT; count?: number }[];
  large?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-2", large ? "gap-3" : "gap-2")}>
      {cells.map((cell) => (
        <div
          key={cell.label}
          className={cn(
            "flex items-center justify-center rounded-[20px] text-center font-extrabold",
            large ? "min-h-[92px] px-3 text-[16px]" : "min-h-[52px] px-2 text-[12px]",
            QUADRANT[cell.tone],
          )}
        >
          <span>
            {cell.label}
            {cell.count != null ? <span className="mt-1 block text-[22px] leading-none">{cell.count}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
