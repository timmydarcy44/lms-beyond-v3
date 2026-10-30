"use client";

import { useEffect } from "react";
import { AppleSuccessCheck } from "@/components/edge-site/apple-success-check";

export function AppleSuccessOverlay({
  open,
  title,
  subtitle,
  onClose,
  autoCloseMs = 2200,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  autoCloseMs?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-xl" aria-hidden />
      <div
        className="relative w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/92 p-10 text-center shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
        role="status"
        aria-live="polite"
      >
        <AppleSuccessCheck size={88} className="mx-auto" />
        <p className="mt-8 text-xl font-semibold tracking-tight text-slate-900">{title}</p>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}
