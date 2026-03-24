import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";
import PilotageClient from "@/app/pilotage/pilotage-client";

const ADMIN_EMAIL = "timmydarcy44@gmail.com";

export default async function PilotagePage() {
  const session = await getSession();
  if (!session || session.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    redirect("/");
  }

  let profiles: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  }> = [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, email, created_at, last_sign_in_at")
      .order("last_sign_in_at", { ascending: false })
      .limit(200);
    if (!error && data) {
      profiles = data;
    }
  } catch {
    profiles = [];
  }

  const lastLogin = profiles[0]?.last_sign_in_at || null;

  const { data: documents } = await supabase
    .from("beyond_note_documents")
    .select("id, user_id, file_name, file_url, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: transformations } = await supabase
    .from("beyond_note_transformations")
    .select("id, user_id, action, result, created_at, document_id")
    .order("created_at", { ascending: false })
    .limit(50);

  let activityLogs: Array<{
    id: string;
    user_id: string | null;
    action_type: string | null;
    transformation_type: string | null;
    result_preview: string | null;
    result_url: string | null;
    created_at: string | null;
  }> = [];
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, user_id, action_type, transformation_type, result_preview, result_url, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) {
      activityLogs = data || [];
    }
  } catch {
    // ignore if table missing
  }

  let lastVisit: string | null = null;
  try {
    const { data: views, error } = await supabase
      .from("page_views")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && views?.length) {
      lastVisit = views[0]?.created_at || null;
    }
  } catch {
    lastVisit = null;
  }

  let favoriteTransformation = "—";
  if (transformations?.length) {
    const counts = new Map<string, number>();
    for (const item of transformations) {
      const action = (item.action || "").toLowerCase();
      const normalized = action.includes("quiz")
        ? "Quiz"
        : action.includes("audio")
          ? "Audio"
          : "Fiche";
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    favoriteTransformation = sorted[0]?.[0] || "—";
  }

  const now = new Date();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const trialUsersCount = profiles.filter((profile) => {
    const createdAt = profile.created_at ? new Date(profile.created_at) : null;
    return createdAt && createdAt >= since7d;
  }).length;

  const recentConnections = profiles.slice(0, 12);

  return (
    <div className="min-h-screen bg-gray-50 text-[#0F172A]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold">Pilotage</h1>
            <p className="text-sm text-slate-500">Interface privée Nevo</p>
          </div>
          <Link
            href="/note-app"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
          >
            Retour à l'app
          </Link>
        </div>
      </header>

      <PilotageClient
        profiles={profiles}
        recentConnections={recentConnections}
        documents={documents || []}
        transformations={transformations || []}
        activityLogs={activityLogs}
        lastVisit={lastVisit}
        lastLogin={lastLogin}
        favoriteTransformation={favoriteTransformation}
        trialUsersCount={trialUsersCount}
      />
    </div>
  );
}
