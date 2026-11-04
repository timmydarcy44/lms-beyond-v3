import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({ color, children, className, id }: { color: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={cn("relative overflow-hidden rounded-[28px] border border-[#1A2340]", className)}
      style={{
        background: `linear-gradient(180deg, ${color}26 0px, #111831 120px)`,
        boxShadow: `inset 0 3px 0 0 ${color}`,
      }}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  color,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}26`, color }}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold leading-none text-white">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-[13px] text-[#9AA3BD]">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TintPill({ color, children, onClick }: { color: string; children: ReactNode; onClick?: () => void }) {
  const className = "rounded-full px-3 py-1.5 text-xs font-extrabold";
  const style = { background: `${color}26`, color };
  if (!onClick) return <span className={className} style={style}>{children}</span>;
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
}

export function fullDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}
