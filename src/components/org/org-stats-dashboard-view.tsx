import type { OrgFormationStats } from "@/lib/org/org-formations";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  variant,
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white shadow-sm",
      )}
    >
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", isDark ? "text-white/40" : "text-black/40")}>
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-[#1D1D1F]")}>
        {value}
      </p>
      {hint ? <p className={cn("mt-1 text-xs", isDark ? "text-white/45" : "text-black/45")}>{hint}</p> : null}
    </div>
  );
}

export function OrgStatsDashboardView({
  stats,
  variant = "light",
}: {
  stats: OrgFormationStats;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em]", isDark ? "text-white/45" : "text-black/40")}>
          Pilotage
        </p>
        <h1 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-[#1D1D1F]")}>
          Statistiques
        </h1>
        <p className={cn("max-w-2xl text-sm", isDark ? "text-white/55" : "text-black/55")}>
          Métriques formations de votre organisation : inscriptions, complétion, temps de connexion et
          résultats aux tests.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard variant={variant} label="Formations" value={stats.coursesCount} hint={`${stats.publishedCount} publiées`} />
        <StatCard variant={variant} label="Inscriptions" value={stats.enrollmentsCount} hint={`${stats.activeLearnersCount} apprenants actifs`} />
        <StatCard variant={variant} label="Taux de complétion" value={`${stats.avgCompletionPercent}%`} hint={`${stats.completedCount} terminées`} />
        <StatCard variant={variant} label="Temps de connexion" value={stats.totalConnectionLabel} hint={`${stats.testsPassedCount} tests réussis (≥ 50%)`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={cn("rounded-2xl border p-5", isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white shadow-sm")}>
          <h2 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-[#1D1D1F]")}>
            Temps par formation
          </h2>
          <ul className="mt-4 space-y-3">
            {stats.topFormations.length === 0 ? (
              <li className={cn("text-sm", isDark ? "text-white/45" : "text-black/45")}>Pas encore de sessions mesurées.</li>
            ) : (
              stats.topFormations.map((f) => (
                <li key={f.courseId} className="flex items-center justify-between gap-3 text-sm">
                  <span className={cn("truncate", isDark ? "text-white/80" : "text-black/80")}>{f.title}</span>
                  <span className={cn("shrink-0 font-semibold", isDark ? "text-white" : "text-[#1D1D1F]")}>{f.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className={cn("rounded-2xl border p-5", isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white shadow-sm")}>
          <h2 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-[#1D1D1F]")}>
            Derniers tests
          </h2>
          <ul className="mt-4 space-y-3">
            {stats.quizRecent.length === 0 ? (
              <li className={cn("text-sm", isDark ? "text-white/45" : "text-black/45")}>Aucun résultat de test pour l’instant.</li>
            ) : (
              stats.quizRecent.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className={cn("block truncate font-medium", isDark ? "text-white" : "text-[#1D1D1F]")}>
                      {q.userName}
                    </span>
                    <span className={cn("block truncate text-xs", isDark ? "text-white/45" : "text-black/45")}>
                      {q.testTitle || "Test"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                      q.score >= 50 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600",
                    )}
                  >
                    {Math.round(q.score)}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
