"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LearnerPreviewBanner({
  targetName,
  returnHref = "/super/utilisateurs?role=btoc",
  sessionLabel = "Votre session Byound Control ne change pas.",
}: {
  targetName: string;
  returnHref?: string;
  sessionLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const endPreview = async () => {
    setBusy(true);
    try {
      await fetch("/api/super/learner-preview/end", { method: "POST" });
      router.push(returnHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-[#3A3118] bg-[#1A1408] px-4 py-2.5 text-sm text-[#F2CF6B]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          Lecture seule — espace de <span className="font-semibold text-white">{targetName}</span>.{" "}
          {sessionLabel}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void endPreview()}
          className="rounded-full border border-[#F2CF6B]/40 px-3 py-1 text-xs font-semibold text-[#F2CF6B] hover:bg-[#3A3118] disabled:opacity-50"
        >
          {busy ? "Fermeture…" : "Quitter l’aperçu"}
        </button>
      </div>
    </div>
  );
}
