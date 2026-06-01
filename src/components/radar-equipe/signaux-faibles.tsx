import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type SignauxFaiblesProps = {
  nbAttention: number;
  nbCritique: number;
  nbDiagnostics: number;
  className?: string;
};

export function SignauxFaibles({
  nbAttention,
  nbCritique,
  nbDiagnostics,
  className,
}: SignauxFaiblesProps) {
  const showDeptHint = nbDiagnostics >= 10;

  return (
    <div className={cn("space-y-3", className)}>
      {nbAttention > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {nbAttention} collaborateur{nbAttention > 1 ? "s" : ""} présente
            {nbAttention > 1 ? "nt" : ""} un signal d&apos;attention cette semaine
            {showDeptHint ? "" : " (données agrégées)"}.
          </span>
        </div>
      ) : (
        <p className="text-sm text-white/50">Aucun signal d&apos;attention cette semaine.</p>
      )}
      {nbCritique > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {nbCritique} signal{nbCritique > 1 ? "s" : ""} critique
            {nbCritique > 1 ? "s" : ""} — action RH recommandée.
          </span>
        </div>
      ) : (
        <p className="text-sm text-white/50">0 signaux critiques.</p>
      )}
    </div>
  );
}
