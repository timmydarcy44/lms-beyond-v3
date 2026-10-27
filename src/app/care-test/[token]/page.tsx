import { getCareQuestionnaire, getCareTest } from "@/lib/expert/care-tests";
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
  const { data: invite } = await db
    .from("expert_care_invites")
    .select("*, client:expert_care_clients(first_name, last_name, email)")
    .eq("token", token)
    .maybeSingle();
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
  const jessica = test ? getCareQuestionnaire(test.slug) : null;
  const client = Array.isArray(invite.client) ? invite.client[0] : invite.client;
  const firstName = typeof client?.first_name === "string" ? client.first_name : "";
  const lastName = typeof client?.last_name === "string" ? client.last_name : "";
  const email = typeof client?.email === "string" ? client.email : "";

  return (
    <div className="min-h-screen bg-white text-[#07080B]">
      {test?.slug === "soft-skills" || !jessica ? (
        <CareSoftSkillsPlayer
          token={token}
          firstName={firstName}
          lastName={lastName}
        />
      ) : (
        <JessicaTypeformPlayer
          questionnaire={jessica}
          inviteToken={token}
          recipientFirstName={firstName}
          recipientLastName={lastName}
          recipientEmail={email}
          submitUrl="/api/public/care-tests/submit"
          appearance="care"
        />
      )}
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-[#07080B]">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-[#636366]">{text}</p>
      </div>
    </div>
  );
}
