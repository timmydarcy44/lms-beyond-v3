import { notFound } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";
import { JessicaTypeformPlayer } from "@/components/jessica-contentin/jessica-typeform-player";

export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string; token: string }>;
};

export default async function PublicJessicaQuestionnaireInvitePage({ params }: Props) {
  const { slug, token } = await params;
  const supabase = getServiceRoleClient();
  if (!supabase) notFound();

  const { data: invite } = await supabase
    .from("jessica_questionnaire_invites")
    .select("*")
    .eq("token", token)
    .eq("questionnaire_slug", slug)
    .maybeSingle();

  if (!invite) notFound();
  if (invite.completed_at) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6 text-center"
        style={{ background: "#F7F3EC", fontFamily: "Georgia, serif" }}
      >
        <div>
          <h1 className="text-3xl font-semibold text-[#2F2A25]">Déjà complété</h1>
          <p className="mt-3 text-[#2F2A25]/70">Ce questionnaire a déjà été renvoyé. Merci.</p>
        </div>
      </div>
    );
  }

  if (!invite.opened_at) {
    await supabase
      .from("jessica_questionnaire_invites")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  const questionnaire = await resolveJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();

  return (
    <JessicaTypeformPlayer
      questionnaire={questionnaire}
      inviteToken={token}
      recipientEmail={invite.recipient_email}
      recipientFirstName={invite.recipient_first_name}
      recipientLastName={invite.recipient_last_name}
    />
  );
}
