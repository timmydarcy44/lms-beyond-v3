import { getCareTest } from "@/lib/expert/care-tests";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { CareSoftSkillsPlayer } from "@/components/expert/care-soft-skills-player";
import { JessicaTypeformPlayer } from "@/components/jessica-contentin/jessica-typeform-player";

export const dynamic = "force-dynamic";

export default async function CareTestInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const raw = (await params).token;
  const token = decodeURIComponent(raw).trim();
  const db = getServiceRoleClient();
  if (!db) {
    return (
      <Message title="Lien indisponible" text="Le service de tests n'est pas joignable pour le moment. Réessayez dans quelques minutes." />
    );
  }
  const { data: invite } = await db.from("expert_care_invites").select("*").eq("token", token).maybeSingle();
  if (!invite) {
    return <Message title="Lien invalide" text="Ce test n'existe pas ou a expiré. Demandez un nouvel envoi à votre expert." />;
  }
  if (invite.completed_at) {
    return <Message title="Déjà complété" text="Ce test a déjà été renvoyé. Merci." />;
  }
  if (!invite.opened_at) {
    await db.from("expert_care_invites").update({ opened_at: new Date().toISOString() }).eq("id", invite.id);
  }
  const test = getCareTest(String(invite.test_slug));
  const jessica = test?.jessicaSlug ? getJessicaQuestionnaire(test.jessicaSlug) : null;

  return (
    <div className="min-h-screen bg-[#07080B] text-[#F4F5F7]">
      {test?.slug === "soft-skills" || !jessica ? (
        <CareSoftSkillsPlayer token={token} />
      ) : (
        <JessicaTypeformPlayer questionnaire={jessica} inviteToken={token} submitUrl="/api/public/care-tests/submit" />
      )}
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080B] px-6 text-center text-[#F4F5F7]">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-[#B5BAC6]">{text}</p>
      </div>
    </div>
  );
}
