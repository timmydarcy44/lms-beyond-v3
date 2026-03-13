"use client";

import { useState } from "react";

interface PainCardProps {
  icon: string;
  before: string;
  after: string;
  accentColor: string;
  accentLight: string;
  accentBorder: string;
}

export default function PainCard({
  icon,
  before,
  after,
  accentColor,
  accentLight,
  accentBorder,
}: PainCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer rounded-2xl min-h-[200px] relative transition-all duration-200"
      style={{
        background: flipped ? accentLight : "rgba(255,255,255,0.03)",
        border: `1px solid ${flipped ? accentBorder : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="p-6 h-full flex flex-col justify-between">
        {!flipped ? (
          <>
            <div>
              <div className="text-3xl mb-4">{icon}</div>
              <p className="text-sm font-semibold text-white/80 leading-relaxed">
                {before}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span
                className="text-[11px] uppercase tracking-wider font-bold"
                style={{ color: accentColor }}
              >
                Voir la solution
              </span>
              <span style={{ color: accentColor }}>→</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider mb-3"
                style={{ color: accentColor }}
              >
                ✓ Avec Beyond
              </div>
              <p className="text-sm text-white/75 leading-relaxed">{after}</p>
            </div>
            <div className="mt-4 text-[10px] text-white/20 tracking-wider">
              Cliquer pour revenir
            </div>
          </>
        )}
      </div>
    </div>
  );
}
