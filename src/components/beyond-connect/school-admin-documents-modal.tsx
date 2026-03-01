"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AdminProfile = {
  first_name?: string | null;
  last_name?: string | null;
  cv_url?: string | null;
  motivation_letter_url?: string | null;
  rqth_url?: string | null;
  cerfa_url?: string | null;
};

type SchoolAdminDocumentsModalProps = {
  profile: AdminProfile;
};

type SlotKey = "cv" | "lm" | "rqth" | "cerfa";

const slotLabels: Record<SlotKey, string> = {
  cv: "CV",
  lm: "Lettre de motivation",
  rqth: "RQTH",
  cerfa: "CERFA",
};

export function SchoolAdminDocumentsModal({ profile }: SchoolAdminDocumentsModalProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [files, setFiles] = useState<Record<SlotKey, string>>({
    cv: "",
    lm: "",
    rqth: "",
    cerfa: "",
  });

  const handleFileChange = (key: SlotKey, file?: File) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file.name }));
  };

  const slots: Array<{ key: SlotKey; url?: string | null }> = [
    { key: "cv", url: profile.cv_url },
    { key: "lm", url: profile.motivation_letter_url },
    { key: "rqth", url: profile.rqth_url },
    { key: "cerfa", url: profile.cerfa_url },
  ];

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
      >
        + Administratif
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border border-white/10 bg-black/80 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <DialogTitle className="sr-only">Documents administratifs</DialogTitle>
          <DialogDescription className="sr-only">
            Téléversement et gestion des documents administratifs
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Documents administratifs</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {slots.map((slot) => (
              <div
                key={slot.key}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">{slotLabels[slot.key]}</p>
                <p className="mt-2 text-sm text-white/80">
                  {files[slot.key] || "Aucun fichier sélectionné"}
                </p>
                {slot.url ? (
                  <a
                    href={slot.url}
                    className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-white/80"
                  >
                    Voir / Télécharger
                  </a>
                ) : null}
                <label className="mt-3 inline-flex cursor-pointer rounded-full border border-white/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  Importer
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => handleFileChange(slot.key, event.target.files?.[0])}
                  />
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Fermer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
