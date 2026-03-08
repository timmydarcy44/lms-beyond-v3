import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export default async function ApprenantSoftSkillsEntryPage() {
  const session = await requireSession();
  if (session.role === "demo") {
    return (
      <div className="min-h-screen bg-[#f5f5f7] px-6 py-10 text-gray-900">
        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Mode Démo</h1>
          <p className="mt-2 text-sm text-gray-500">
            Accédez au test soft skills depuis l'introduction.
          </p>
          <a
            href="/dashboard/apprenant/soft-skills-intro"
            className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Ouvrir l'introduction
          </a>
        </div>
      </div>
    );
  }
  const service = await getServiceRoleClientOrFallback();

  if (!service) {
    redirect("/dashboard/apprenant/soft-skills-intro");
  }

  const { data: profileById } = await service
    .from("profiles")
    .select("id, has_paid_soft_skills")
    .eq("id", session.id)
    .maybeSingle();

  let hasPaidSoftSkills = Boolean(profileById?.has_paid_soft_skills);

  if (!profileById && session.email) {
    const { data: profileByEmail } = await service
      .from("profiles")
      .select("id, has_paid_soft_skills")
      .eq("email", session.email)
      .maybeSingle();
    hasPaidSoftSkills = Boolean(profileByEmail?.has_paid_soft_skills);
  }

  if (hasPaidSoftSkills) {
    redirect("/soft-skills/test");
  }

  redirect("/dashboard/apprenant/soft-skills-intro");
}
