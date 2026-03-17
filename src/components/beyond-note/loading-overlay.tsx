"use client";
import { useEffect, useState } from "react";

const actionConfig: Record<string, { message: string; submessage: string }> = {
  upload: { message: "Votre document est en cours de traitement", submessage: "Neo analyse et extrait le contenu..." },
  "revision-sheet": { message: "Creation de votre fiche de revision", submessage: "Neo structure vos notes..." },
  reformulate: { message: "Neo reformule votre contenu", submessage: "Adaptation du style en cours..." },
  translate: { message: "Neo traduit votre contenu", submessage: "Traduction en cours..." },
  diagram: { message: "Votre schema est en cours de realisation", submessage: "Neo visualise vos idees..." },
  audio: { message: "Neo enregistre votre texte", submessage: "Synthese audio en cours..." },
  flashcards: { message: "Creation de vos flashcards", submessage: "Neo prepare vos cartes de revision..." },
  quiz: { message: "Generation de votre quiz", submessage: "Neo formule vos questions..." },
};

export function LoadingOverlay({
  isVisible,
  action,
  type,
}: {
  isVisible: boolean;
  action?: string;
  type?: "upload" | "transformation";
}) {
  const [dots, setDots] = useState("");
  const config = actionConfig[action || "upload"] || { message: "Traitement en cours", submessage: "Neo travaille pour vous..." };

  useEffect(() => {
    if (!isVisible) { setDots(""); return; }
    const i = setInterval(() => setDots(p => p.length >= 3 ? "" : p + "."), 500);
    return () => clearInterval(i);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
      <div className="relative z-10 flex flex-col items-center gap-6 bg-white/95 rounded-3xl px-12 py-10 max-w-sm w-full mx-4" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }} />
          <div className="absolute inset-2 rounded-full animate-pulse opacity-40" style={{ background: "linear-gradient(135deg, #F97316, #be1354)" }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}>
            <span className="text-white font-bold text-2xl">N</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[#0F1117] font-semibold text-lg mb-2">{config.message}{dots}</p>
          <p className="text-[#9CA3AF] text-sm">{config.submessage}</p>
        </div>
        <div className="w-full h-1 bg-[#F3F4F8] rounded-full overflow-hidden">
          <div className="h-full rounded-full animate-progress" style={{ background: "linear-gradient(90deg, #be1354, #F97316)" }} />
        </div>
        <p className="text-[#9CA3AF] text-xs">Merci de patienter quelques instants</p>
      </div>
    </div>
  );
}

export function SuccessOverlay({ isVisible, onDismiss }: { isVisible: boolean; onDismiss: () => void }) {
  useEffect(() => {
    if (isVisible) { const t = setTimeout(onDismiss, 2500); return () => clearTimeout(t); }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
      <div className="relative z-10 flex flex-col items-center gap-4 bg-white/95 rounded-3xl px-12 py-10 max-w-xs w-full mx-4" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}>
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[#0F1117] font-bold text-xl text-center">Votre document est pret</p>
        <p className="text-[#9CA3AF] text-sm text-center">Neo a termine l analyse</p>
      </div>
    </div>
  );
}