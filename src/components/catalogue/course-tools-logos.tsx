"use client";

import { useState } from "react";
import { getCourseToolLogoUrl } from "@/lib/course-tools";

function ToolOrInitial({
  tool,
  label,
  size = 28,
}: {
  tool: string;
  label: string;
  size?: number;
}) {
  const initialUrl = getCourseToolLogoUrl(tool);
  const [src, setSrc] = useState<string | null>(initialUrl);
  if (!src) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
        {label.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs bucket / public, pas besoin de remotePatterns
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className="h-5 w-5 object-contain opacity-90"
      loading="lazy"
      onError={() => setSrc(null)}
    />
  );
}

export function CourseToolsLogos({
  tools,
  className,
  size = 28,
}: {
  tools: string[];
  className?: string;
  size?: number;
}) {
  const cleaned = (Array.isArray(tools) ? tools : [])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);
  if (cleaned.length === 0) return null;

  return (
    <div className={className ?? ""} aria-label="Outils utilisés">
      <div className="flex flex-wrap items-center gap-3">
        {cleaned.map((tool) => (
          <div
            key={tool}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5"
            title={tool}
          >
            <ToolOrInitial tool={tool} label={tool} size={size} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{tool}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
