import { notFound } from "next/navigation";
import { CareSoftSkillsPlayer } from "@/components/expert/care-soft-skills-player";
import { JessicaTypeformPlayer } from "@/components/jessica-contentin/jessica-typeform-player";
import { getCareTest } from "@/lib/expert/care-tests";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ByoundTestInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getServiceRoleClient();
  if (!db) notFound();
  const { data: invite } = await db.from("expert_care_invites").select("*").eq("token", token).maybeSingle();
  if (!invite) notFound();
  if (invite.completed_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080B] px-6 text-center text-[#F4F5F7]">
        <div>
          <h1 className="text-3xl font-extrabold">Déjà complété</h1>
          <p className="mt-3 text-[#B5BAC6]">Ce test a déjà été renvoyé. Merci.</p>
        </div>
      </div>
    );
  }
  if (!invite.opened_at) {
    await db.from("expert_care_invites").update({ opened_at: new Date().toISOString() }).eq("id", invite.id);
  }
  const test = getCareTest(String(invite.test_slug));
  if (!test) notFound();

  return (
    <div className="min-h-screen bg-[#07080B] text-[#F4F5F7]">
      {test.slug === "soft-skills" ? (
        <CareSoftSkillsPlayer token={token} />
      ) : (
        <JessicaTypeformPlayer
          questionnaire={getJessicaQuestionnaire(test.jessicaSlug ?? "") ?? { slug: test.slug, title: test.title, description: test.description, questions: [] }}
          inviteToken={token}
          submitUrl="/api/public/care-tests/submit"
        />
      )}
    </div>
  );
}
