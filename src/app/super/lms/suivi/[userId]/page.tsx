import Link from "next/link";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  formatLearnerDisplayName,
  roleStatusLabel,
} from "@/lib/lms/learner-suivi-data";
import {
  formatDurationCompact,
  metricsFromLegacySessionRows,
} from "@/lib/lms/lms-metrics";

export const dynamic = "force-dynamic";

export default async function LearnerSuiviDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const db = getServiceRoleClient();
  if (!db) {
    return <main className="p-8 text-sm text-white">Client serveur absent.</main>;
  }

  const [{ data: profile }, { data: sessions }, { data: relances }] = await Promise.all([
    db.from("profiles").select("id, email, first_name, last_name, role").eq("id", userId).maybeSingle(),
    db
      .from("learning_sessions")
      .select("started_at, ended_at, duration_seconds, duration_active_seconds, content_type, content_id")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(500),
    db
      .from("learner_relances")
      .select("sent_at, subject, leaf_title, sent_by")
      .eq("learner_id", userId)
      .order("sent_at", { ascending: false })
      .limit(20),
  ]);

  if (!profile) {
    return (
      <main className="p-8 text-white">
        <p>Apprenant introuvable.</p>
        <Link href="/super/lms/suivi" className="mt-4 inline-block text-[#A99BFF]">
          ← Retour
        </Link>
      </main>
    );
  }

  const { displayName, nameMissing } = formatLearnerDisplayName(profile.first_name, profile.last_name);
  const metrics = metricsFromLegacySessionRows(sessions ?? []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-white sm:px-8" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
      <Link href="/super/lms/suivi" className="text-[13px] font-semibold text-[#A99BFF]">
        ← Suivi des apprenants
      </Link>
      <header>
        <p className="text-[13.5px] font-extrabold text-[#A99BFF]">LMS</p>
        <h1 className="mt-1 text-[28px] font-extrabold" style={{ color: nameMissing ? "#6C7593" : undefined }}>
          {displayName}
        </h1>
        <p className="mt-1 text-sm text-[#9AA3BD]">
          {nameMissing ? profile.email : `${roleStatusLabel(profile.role)} · ${profile.email}`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Séances" value={String(metrics.sessionCount)} />
        <Stat label="Temps connecté" value={formatDurationCompact(metrics.connectedSeconds)} />
        <Stat label="Temps actif" value={formatDurationCompact(metrics.activeSeconds)} />
        <Stat
          label="Invariant"
          value={metrics.activeSeconds <= metrics.connectedSeconds ? "OK" : "KO"}
        />
      </div>

      <section className="rounded-[24px] border border-[#26304F] bg-[#111831] p-5">
        <h2 className="text-[15px] font-extrabold">Séances (recalculées)</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {metrics.sessions.length === 0 ? (
            <li className="text-[#6C7593]">Aucune séance.</li>
          ) : (
            metrics.sessions
              .slice()
              .reverse()
              .slice(0, 40)
              .map((s, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 border-t border-[#26304F] py-2 first:border-0">
                  <span className="text-[#9AA3BD]">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Paris",
                    }).format(s.startedAt)}
                    {" → "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      timeStyle: "short",
                      timeZone: "Europe/Paris",
                    }).format(s.endedAt)}
                  </span>
                  <span>
                    connecté {formatDurationCompact(s.connectedSeconds)} · actif{" "}
                    {formatDurationCompact(s.activeSeconds)}
                  </span>
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="rounded-[24px] border border-[#26304F] bg-[#111831] p-5">
        <h2 className="text-[15px] font-extrabold">Relances</h2>
        <ul className="mt-4 space-y-2 text-sm text-[#9AA3BD]">
          {(relances ?? []).length === 0 ? (
            <li>Aucune relance enregistrée.</li>
          ) : (
            (relances as Array<{ sent_at: string; subject: string | null; leaf_title: string | null }>).map((r, i) => (
              <li key={i}>
                {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(
                  new Date(r.sent_at),
                )}
                {" · "}
                {r.subject ?? "Relance"}
                {r.leaf_title ? ` · ${r.leaf_title}` : ""}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#26304F] bg-[#111831] px-4 py-3">
      <p className="text-[12px] font-semibold text-[#6C7593]">{label}</p>
      <p className="mt-1 text-[20px] font-extrabold">{value}</p>
    </div>
  );
}
