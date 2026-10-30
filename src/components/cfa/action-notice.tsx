"use client";

import { Check, Loader2 } from "lucide-react";

export function ActionNotice({
  open,
  state,
  title,
  detail,
  onClose,
}: {
  open: boolean;
  state: "working" | "done" | "error";
  title: string;
  detail?: string;
  onClose?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4" role="status">
      <div className="w-full max-w-[340px] rounded-[28px] bg-[#1C1C1E] px-6 py-7 text-center text-white shadow-2xl">
        <p className="text-[15px] font-semibold tracking-tight">Byound</p>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/80">
          {state === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {state === "done" ? <Check className="h-4 w-4 text-[#6BE3C0]" /> : null}
          <span>{state === "working" ? "En cours" : state === "done" ? "Terminé" : "À corriger"}</span>
        </div>
        <p className="mt-4 text-[28px] font-semibold leading-tight tracking-tight">{title}</p>
        {detail ? <p className="mt-3 text-sm leading-5 text-white/65">{detail}</p> : null}
        <p className="mt-6 text-xs text-white/40">Sécurisé</p>
        {state !== "working" && onClose ? (
          <button type="button" className="mt-4 h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#1C1C1E]" onClick={onClose}>Fermer</button>
        ) : null}
      </div>
    </div>
  );
}
