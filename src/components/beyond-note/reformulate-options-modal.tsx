"use client";

interface ReformulateOptionsModalProps {
  isOpen: boolean;
  onSelect: (style: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function ReformulateOptionsModal({ isOpen, onSelect, onClose, disabled }: ReformulateOptionsModalProps) {
  if (!isOpen) return null;
  const styles = [
    { id: "examples", label: "Reformuler avec des exemples", desc: "Ajoute des exemples concrets." },
    { id: "simple", label: "Reformuler simplement", desc: "Texte court, vocabulaire accessible." },
    { id: "situation", label: "Reformuler avec mise en situation", desc: "Scenario concret." },
    { id: "5ans", label: "Reformuler comme si j'avais 5 ans", desc: "Phrases tres simples." },
  ];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[201] bg-[#111118] border border-white/10 rounded-3xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <p className="font-semibold text-white text-lg">Choisissez un style</p>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        <div className="space-y-3">
          {styles.map(s => (
            <button
              key={s.id}
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); onSelect(s.id); }}
              className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 transition-all cursor-pointer"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              <p className="text-white font-medium text-sm mb-1">{s.label}</p>
              <p className="text-white/40 text-xs">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
