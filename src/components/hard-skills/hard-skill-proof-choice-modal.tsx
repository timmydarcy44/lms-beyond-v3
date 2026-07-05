"use client";

type Props = {
  open: boolean;
  skillName: string | null;
  onClose: () => void;
  onChooseInterview: () => void;
  onChooseImport: () => void;
};

export function HardSkillProofChoiceModal({ open, skillName, onClose, onChooseInterview, onChooseImport }: Props) {
  if (!open || !skillName) return null;

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#0D111A] p-6 shadow-2xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Niveau de preuve</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{skillName}</h3>
        <p className="mt-3 text-sm text-white/55">Comment souhaitez-vous démontrer cette compétence ?</p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onChooseInterview}
            className="w-full rounded-2xl border border-[#3D7BFF]/40 bg-[#3D7BFF]/10 px-4 py-4 text-left transition hover:bg-[#3D7BFF]/20"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#3D7BFF]">
                <span className="h-2 w-2 rounded-full bg-[#3D7BFF]" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Entretien expérientiel EDGE</span>
                <span className="mt-0.5 block text-xs text-[#3D7BFF]/80">Recommandé</span>
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onChooseImport}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white/30" />
              <span className="text-sm font-semibold text-white">Importer une preuve</span>
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/55 hover:text-white"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
