import { getServerClient } from "@/lib/supabase/server";
import OpenBadgesInboxView from "./view";

const getAdminOrgId = async (userId: string) => {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data: membership } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1)
    .single();
  return membership?.org_id ?? null;
};

export default async function AdminOpenBadgesPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    return <div className="p-8 text-sm text-slate-600">Supabase indisponible.</div>;
  }
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) {
    return <div className="p-8 text-sm text-slate-600">Connexion requise.</div>;
  }
  const orgId = await getAdminOrgId(data.user.id);
  const auth = orgId
    ? { userId: data.user.id, orgId, role: "ADMIN" }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Open Badges</p>
        <h1 className="text-2xl font-semibold text-slate-900">Inbox — Demandes</h1>
        <p className="text-sm text-slate-600">
          Traitez les demandes de badges de votre organisation.
        </p>
      </div>
      <OpenBadgesInboxView auth={auth} />
    </div>
  );
}
