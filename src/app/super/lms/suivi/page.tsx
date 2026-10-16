import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionRow = {
  user_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  duration_active_seconds: number | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
};

type LeafRow = { user_id: string; completed_at: string | null; leaf_title: string | null };
type CountRow = { user_id?: string | null; profile_id?: string | null; created_at?: string | null };

function secondsLabel(total: number): string {
  const seconds = Math.max(0, Math.floor(total));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return seconds > 0 ? `${seconds} s` : "0 min";
}

function whenLabel(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

export default async function SuperLearnerSuiviPage() {
  const db = getServiceRoleClient();
  if (!db) {
    return <main className="p-8 text-sm">Suivi indisponible : client serveur absent.</main>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("learning_sessions")
    .select("user_id, started_at, ended_at, duration_seconds, duration_active_seconds")
    .order("started_at", { ascending: false })
    .limit(8000);

  const sessionRows = (sessions ?? []) as SessionRow[];
  const userIds = [...new Set(sessionRows.map((row) => row.user_id).filter(Boolean))];

  const [profilesRes, leavesRes, notesRes, transformsRes] = await Promise.all([
    userIds.length
      ? db.from("profiles").select("id, email, first_name, last_name, role").in("id", userIds.slice(0, 300))
      : Promise.resolve({ data: [], error: null }),
    db.from("learner_leaf_completions").select("user_id, completed_at, leaf_title").order("completed_at", { ascending: false }).limit(5000),
    db.from("beyond_note_documents").select("user_id, created_at").order("created_at", { ascending: false }).limit(5000),
    db.from("lesson_ai_user_transformations").select("user_id, created_at").order("created_at", { ascending: false }).limit(5000),
  ]);

  const profiles = new Map(((profilesRes.data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const leavesByUser = new Map<string, LeafRow[]>();
  for (const row of (leavesRes.error ? [] : (leavesRes.data ?? [])) as LeafRow[]) {
    const list = leavesByUser.get(row.user_id) ?? [];
    list.push(row);
    leavesByUser.set(row.user_id, list);
  }
  const notesByUser = new Map<string, number>();
  if (!notesRes.error) {
    for (const row of (notesRes.data ?? []) as CountRow[]) {
      const id = String(row.user_id ?? "");
      if (!id) continue;
      notesByUser.set(id, (notesByUser.get(id) ?? 0) + 1);
    }
  }
  const aiByUser = new Map<string, number>();
  if (!transformsRes.error) {
    for (const row of (transformsRes.data ?? []) as CountRow[]) {
      const id = String(row.user_id ?? "");
      if (!id) continue;
      aiByUser.set(id, (aiByUser.get(id) ?? 0) + 1);
    }
  }
  const grouped = new Map<string, SessionRow[]>();
  for (const row of sessionRows) {
    const list = grouped.get(row.user_id) ?? [];
    list.push(row);
    grouped.set(row.user_id, list);
  }

  const rows = [...grouped.entries()]
    .map(([userId, items]) => {
      const profile = profiles.get(userId);
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || userId.slice(0, 8);
      const connected = items.reduce((sum, item) => sum + (Number(item.duration_seconds) || 0), 0);
      const active = items.reduce((sum, item) => sum + (Number(item.duration_active_seconds) || 0), 0);
      const last = items.reduce<string | null>((best, item) => {
        const stamp = item.ended_at || item.started_at;
        if (!stamp) return best;
        if (!best || stamp > best) return stamp;
        return best;
      }, null);
      const first = items.reduce<string | null>((best, item) => {
        const stamp = item.started_at;
        if (!stamp) return best;
        if (!best || stamp < best) return stamp;
        return best;
      }, null);
      const leaves = leavesByUser.get(userId) ?? [];
      return {
        userId,
        name,
        email: profile?.email ?? "—",
        role: profile?.role ?? "—",
        last,
        first,
        connected,
        active,
        sessions: items.length,
        chapters: leaves.length,
        lastChapter: leaves[0]?.leaf_title ?? "—",
        notes: notesByUser.get(userId) ?? 0,
        transformations: aiByUser.get(userId) ?? 0,
      };
    })
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));

  return (
    <main className="px-4 py-8 text-white sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">LMS</p>
      <h1 className="mt-1 text-3xl font-bold text-white">Suivi des apprenants</h1>
      <p className="mt-2 max-w-3xl text-sm text-white/70">
        Horodatage des connexions, temps passé, chapitres validés avec Suivant, notes et transformations.
      </p>
      {sessionError ? <p className="mt-4 text-sm text-rose-300">{sessionError.message}</p> : null}
      {leavesRes.error ? (
        <p className="mt-3 text-sm text-amber-200">
          Les chapitres validés apparaîtront après le script supabase/scripts/historique_transformations_ia.sql.
        </p>
      ) : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th className="px-3 py-3">Apprenant</th>
              <th className="px-3 py-3">Dernière connexion</th>
              <th className="px-3 py-3">Première</th>
              <th className="px-3 py-3">Temps connecté</th>
              <th className="px-3 py-3">Temps actif</th>
              <th className="px-3 py-3">Séances</th>
              <th className="px-3 py-3">Chapitres</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3">Transformations</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-white/60" colSpan={9}>Aucune session enregistrée.</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.userId} className="border-t border-white/10">
                <td className="px-3 py-3">
                  <strong className="block">{row.name}</strong>
                  <span className="text-xs text-white/60">{row.email} · {row.role}</span>
                  <span className="mt-1 block text-xs text-white/50">{row.lastChapter}</span>
                </td>
                <td className="px-3 py-3">{whenLabel(row.last)}</td>
                <td className="px-3 py-3">{whenLabel(row.first)}</td>
                <td className="px-3 py-3">{secondsLabel(row.connected)}</td>
                <td className="px-3 py-3">{secondsLabel(row.active)}</td>
                <td className="px-3 py-3">{row.sessions}</td>
                <td className="px-3 py-3">{row.chapters}</td>
                <td className="px-3 py-3">{row.notes}</td>
                <td className="px-3 py-3">{row.transformations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
