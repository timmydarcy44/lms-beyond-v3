import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolStudentSuiviClient } from "@/components/beyond-connect/school-student-suivi-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApprenantSuiviPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const { id } = await params;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10 text-black">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          Profil introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-black">
      <div className="mx-auto max-w-6xl space-y-6">
        <SchoolStudentSuiviClient profile={profile} />
      </div>
    </div>
  );
}
