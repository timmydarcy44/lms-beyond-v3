 "use client";

import { useState } from "react";

export function ManifestoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-sm border border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white"
      >
        Lire notre manifeste
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-[#050A18] p-8 text-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tighter">Notre manifeste</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-[0.3em] text-[#E5E5E5]"
              >
                Fermer
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#E5E5E5]">
              Nous croyons que la performance se prouve, se mesure et se certifie. Beyond Connect réunit les meilleurs
              profils et les entreprises les plus exigeantes autour d&apos;une même exigence : transformer le talent en
              résultats concrets.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
