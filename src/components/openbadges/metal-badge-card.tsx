"use client";

import { useEffect, useState } from "react";

type Props = {
  name: string;
  recipientName: string;
  issuedLabel: string;
  level: number | null;
};

export function MetalBadgeCard({ name, recipientName, issuedLabel, level }: Props) {
  const [spot, setSpot] = useState({ x: 70, y: 20 });
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[560px] py-4 [perspective:900px]">
      <div
        className="relative aspect-[560/353] overflow-hidden rounded-[30px] text-[#F2F2F4] shadow-[0_30px_80px_rgba(0,0,0,0.45)] [transform:rotateX(10deg)]"
        style={{
          background: "linear-gradient(125deg, #1A1B22, #2C2D36 28%, #15161C 52%, #33343F 74%, #17181E)",
        }}
        onMouseMove={motion ? (event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setSpot({
            x: ((event.clientX - rect.left) / rect.width) * 100,
            y: ((event.clientY - rect.top) / rect.height) * 100,
          });
        } : undefined}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: motion
              ? `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, rgba(169,155,255,0.34), transparent 46%)`
              : "linear-gradient(118deg, transparent 32%, rgba(169,155,255,0.18) 50%, transparent 66%)",
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -bottom-20 -right-6 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 text-sm">
            <span className="font-bold tracking-[-0.04em]">Byound</span>
            <span className="text-right text-[rgba(242,242,244,0.6)]">
              Open Badge{level != null ? ` · Niveau ${level}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#A99BFF] to-[#6E5BFF] text-lg font-bold text-[#050608]">
              B
            </div>
            <p className="line-clamp-2 text-xl font-bold tracking-[-0.04em] sm:text-2xl">{name}</p>
          </div>
          <div className="flex items-end justify-between gap-4 text-sm">
            <div>
              <p className="text-[rgba(242,242,244,0.5)]">Titulaire</p>
              <p className="font-semibold">{recipientName}</p>
            </div>
            <div className="text-right">
              <p className="text-[rgba(242,242,244,0.5)]">Obtenu le</p>
              <p className="font-semibold">{issuedLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
