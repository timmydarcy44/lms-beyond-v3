"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EdgeDashboardCardAccent = "blue" | "red" | "green" | "violet";

const ACCENT: Record<
  EdgeDashboardCardAccent,
  { color: string; bigOpacity: number; smallOpacity: number }
> = {
  blue: { color: "#3D7BFF", bigOpacity: 0.32, smallOpacity: 0.2 },
  red: { color: "#FF3B30", bigOpacity: 0.32, smallOpacity: 0.2 },
  green: { color: "#34C759", bigOpacity: 0.32, smallOpacity: 0.2 },
  violet: { color: "#aa5aff", bigOpacity: 0.32, smallOpacity: 0.2 },
};

type Props = {
  href?: string;
  onClick?: () => void;
  accent: EdgeDashboardCardAccent;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  className?: string;
};

export function EdgeDashboardActionCard({
  href,
  onClick,
  accent,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  className,
}: Props) {
  const { color, bigOpacity, smallOpacity } = ACCENT[accent];
  const bigBg = `radial-gradient(circle, ${hexToRgba(color, bigOpacity)} 0%, transparent 70%)`;
  const smallBg = `radial-gradient(circle, ${hexToRgba(color, smallOpacity)} 0%, transparent 70%)`;

  const inner = (
    <>
      <div
        className="pointer-events-none absolute -right-10 -top-[50px] h-[140px] w-[140px] rounded-full transition-all duration-[400ms] ease-out group-hover:translate-x-[-6px] group-hover:translate-y-[6px] group-hover:scale-[1.15]"
        style={{ background: bigBg, filter: "blur(2px)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -right-4 h-[65px] w-[65px] rounded-full transition-all duration-[400ms] ease-out group-hover:scale-110"
        style={{ background: smallBg }}
        aria-hidden
      />
      <ChevronRight
        className="absolute right-[18px] top-[18px] h-5 w-5 text-white/70 opacity-0 transition-all duration-[400ms] ease-out group-hover:translate-x-1 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="relative flex h-10 w-10 items-center justify-center rounded-[11px] transition-transform duration-[400ms] ease-out group-hover:scale-[1.08] group-hover:-rotate-3"
        style={{ backgroundColor: hexToRgba(color, 0.15) }}
      >
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.75} />
      </div>
      <div className="relative mt-auto space-y-1 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{eyebrow}</p>
        <p className="text-[15px] font-extrabold tracking-[-0.02em] text-white">{title}</p>
        <p className="text-[13px] text-white/40">{subtitle}</p>
      </div>
    </>
  );

  const cardClass = cn(
    "group relative flex h-[168px] w-full flex-col overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#14141a] p-[22px] text-left transition-all duration-[400ms] ease-out",
    "hover:-translate-y-1 hover:bg-[#181820] hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.55)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cardClass}>
      {inner}
    </button>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
