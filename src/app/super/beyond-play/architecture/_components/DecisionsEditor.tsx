type DecisionsEditorProps = {
  turn: unknown;
  onUpdateTurn: (updater: unknown) => void;
};

export function DecisionsEditor({}: DecisionsEditorProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
      Éditeur de décisions (stub)
    </div>
  );
}
