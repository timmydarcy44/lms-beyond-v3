"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type EdgeLauncherApp = {
  id: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  image?: string;
};

function GridDotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden className={className}>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <circle key={`${row}-${col}`} cx={3 + col * 6} cy={3 + row * 6} r={1.35} />
        )),
      )}
    </svg>
  );
}

type EdgeAppsLauncherProps = {
  apps: EdgeLauncherApp[];
  activeAppId: string;
  onAppChange: (id: string) => void;
  /** Prefetch routes/code quand le panel s’ouvre. */
  onOpenPrefetch?: (apps: EdgeLauncherApp[]) => void;
  title?: string;
  className?: string;
  light?: boolean;
};

export function EdgeAppsLauncher({
  apps,
  activeAppId,
  onAppChange,
  onOpenPrefetch,
  title = "Applications",
  className,
  light = false,
}: EdgeAppsLauncherProps) {
  const [open, setOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const hasImages = apps.some((a) => Boolean(a.image));

  // Précharger les images dès le mount — le panel s’ouvre sans attendre le réseau
  useEffect(() => {
    for (const app of apps) {
      if (!app.image) continue;
      const img = new window.Image();
      img.decoding = "async";
      img.src = app.image;
    }
  }, [apps]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCompactViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) onOpenPrefetch?.(apps);
      return next;
    });
  }, [apps, onOpenPrefetch]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [close, open]);

  const selectApp = (id: string) => {
    close();
    if (id === activeAppId) return;
    onAppChange(id);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <style jsx global>{`
        @keyframes edgeAppLauncherIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <button
        type="button"
        aria-label={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
          light
            ? cn(
                "border-black/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]",
                open && "border-[#3D7BFF]/40 bg-[#3D7BFF]/10 text-[#1D1D1F]",
              )
            : cn(
                "border-white/[0.06] bg-white/[0.03] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white",
                open && "border-[#3D7BFF]/35 bg-[#3D7BFF]/12 text-white",
              ),
        )}
      >
        <GridDotsIcon className="h-4 w-4" />
      </button>

      {open ? (
        <>
          {isCompactViewport ? (
            <button
              type="button"
              aria-label="Fermer"
              className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[1px]"
              onClick={close}
            />
          ) : null}

          <div
            id={panelId}
            role="dialog"
            aria-label={title}
            className={cn(
              "z-[90] overflow-hidden rounded-2xl border shadow-[0_24px_64px_-20px_rgba(0,0,0,0.65)]",
              light
                ? "border-black/10 bg-[#16161E] text-white"
                : "border-white/[0.07] bg-[#16161E]/97 backdrop-blur-xl",
              isCompactViewport
                ? "fixed left-4 right-4 top-[11%] mx-auto max-w-[400px]"
                : "absolute right-0 top-[calc(100%+10px)] w-[min(380px,calc(100vw-1.5rem))]",
            )}
            style={{ animation: "edgeAppLauncherIn 160ms ease-out" }}
          >
            <div className="px-5 pb-1 pt-5">
              <p className="text-[13px] font-semibold tracking-[-0.01em] text-white/90">{title}</p>
            </div>

            <div
              className={cn(
                "grid gap-x-3 gap-y-4 px-5 pb-6 pt-4",
                hasImages ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              {apps.map((app) => {
                const selected = app.id === activeAppId;
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => selectApp(app.id)}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition-[background-color,transform] duration-150 ease-out",
                      "bg-transparent hover:bg-white/[0.05] active:scale-[0.97]",
                    )}
                  >
                    {app.image ? (
                      <span className="relative">
                        <span
                          className={cn(
                            "block h-[54px] w-[54px] overflow-hidden rounded-[13px] bg-white/[0.04]",
                            selected && "outline outline-[1.5px] outline-offset-[2px] outline-[#3D7BFF]/75",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={app.image}
                            alt=""
                            width={54}
                            height={54}
                            className="h-full w-full object-cover"
                            decoding="async"
                            // Eager : assets déjà préchargés au mount ; évite flash au open
                            loading="eager"
                          />
                        </span>
                        {selected ? (
                          <span
                            className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#3D7BFF]"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-[12px] border transition",
                          selected
                            ? "border-[#3D7BFF]/45 bg-[#3D7BFF]/12 text-[#3D7BFF]"
                            : "border-white/[0.06] bg-white/[0.03] text-white/55 group-hover:text-white/85",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </span>
                    )}
                    <span className="w-full truncate text-[11px] font-medium leading-none text-white/70 group-hover:text-white/90">
                      {app.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
