import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolStudentProfile } from "@/components/beyond-connect/school-student-profile";
import { SchoolAdminDocumentsModal } from "@/components/beyond-connect/school-admin-documents-modal";
import { mockOffers, mockUsers } from "@/lib/mocks/appData";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ id?: string }>;
};

export default async function SchoolStudentByIdPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const profileId = resolvedSearchParams?.id || id;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  const mockProfile = mockUsers.find((user) => user.id === profileId);

  if (!profile && !mockProfile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] px-6 py-10 text-[#1D1D1F]">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          Profil introuvable.
        </div>
      </div>
    );
  }

  const { data: offers } = await supabase
    .from("job_offers")
    .select("id, title, city, salary, description, school_id")
    .limit(3);

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-6 py-10 text-[#1D1D1F]">
      <div className="mx-auto max-w-6xl space-y-6">
        <SchoolAdminDocumentsModal profile={profile || mockProfile} />
        <SchoolStudentProfile profile={profile || mockProfile} offers={offers?.length ? offers : mockOffers} />
      </div>
    </div>
  );
}
