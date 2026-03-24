import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "timmydarcy44@gmail.com";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("fr-FR") : "—";

const slicePreview = (value?: string | null, max = 180) => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

export default async function PilotageUserPage({ params }: { params: { userId: string } }) {
  const session = await getSession();
  if (!session || session.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    redirect("/");
  }

  const userId = params.userId;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, created_at")
    .eq("id", userId)
    .maybeSingle();

  let lastSignIn: string | null = null;
  try {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 100 });
    const user = data?.users?.find((item) => item.id === userId);
    lastSignIn = user?.last_sign_in_at || null;
  } catch {
    lastSignIn = null;
  }

  const { data: documents } = await supabase
    .from("beyond_note_documents")
    .select("id, file_name, file_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: transformations } = await supabase
    .from("beyond_note_transformations")
    .select("id, action, result, created_at, document_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  let activityLogs: Array<{
    id: string;
    action_type: string | null;
    transformation_type: string | null;
    result_preview: string | null;
    result_url: string | null;
    created_at: string | null;
  }> = [];
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, action_type, transformation_type, result_preview, result_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) {
      activityLogs = data || [];
    }
  } catch {
    // ignore if table missing
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#0F172A]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold">Fiche client</h1>
            <p className="text-sm text-slate-500">Détail utilisateur</p>
          </div>
          <Link
            href="/pilotage"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Retour au pilotage
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Identité</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-slate-400">Nom</div>
              <div className="text-sm text-slate-700">
                {profile?.full_name ||
                  [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
                  "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Email</div>
              <div className="text-sm text-slate-700">{profile?.email || "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Créé le</div>
              <div className="text-sm text-slate-700">{formatDate(profile?.created_at)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Dernière connexion</div>
              <div className="text-sm text-slate-700">{formatDate(lastSignIn)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Documents uploadés</h2>
            <div className="mt-4 space-y-3">
              {(documents || []).map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs uppercase text-slate-400">{formatDate(doc.created_at)}</div>
                  <div className="mt-1 text-sm">{doc.file_name || "Document"}</div>
                  {doc.file_url ? (
                    <a
                      className="mt-2 inline-flex text-xs text-orange-600 hover:text-orange-500"
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ouvrir le fichier
                    </a>
                  ) : null}
                </div>
              ))}
              {documents?.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun document trouvé.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Transformations</h2>
            <div className="mt-4 space-y-3">
              {(transformations || []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs uppercase text-slate-400">{formatDate(item.created_at)}</div>
                  <div className="mt-1 text-sm">Type: {item.action || "—"}</div>
                  <div className="mt-2 text-sm text-slate-600">{slicePreview(item.result)}</div>
                </div>
              ))}
              {transformations?.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune transformation trouvée.</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Historique d'activités</h2>
          <div className="mt-4 space-y-3">
            {(activityLogs || []).map((log) => (
              <div key={log.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs uppercase text-slate-400">{formatDate(log.created_at)}</div>
                <div className="mt-1 text-sm">
                  {log.action_type || "activité"} • {log.transformation_type || "—"}
                </div>
                <div className="mt-2 text-sm text-slate-600">{slicePreview(log.result_preview)}</div>
                {log.result_url ? (
                  <a
                    className="mt-2 inline-flex text-xs text-orange-600 hover:text-orange-500"
                    href={log.result_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir le résultat
                  </a>
                ) : null}
              </div>
            ))}
            {activityLogs.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune activité enregistrée.</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
