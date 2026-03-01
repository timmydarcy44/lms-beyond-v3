type ScenesEditorProps = {
  turn: unknown;
  onUpdateTurn: (updater: unknown) => void;
};

export function ScenesEditor({}: ScenesEditorProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
      Éditeur de scènes (stub)
    </div>
  );
}
