import { ExpertPageFrame, ExpertPageHeader } from "@/components/expert/expert-ui";
import { ProposeFormationForm } from "@/components/expert/propose-formation-form";
import { getSession } from "@/lib/auth/session";
import { listExpertFormationProposals } from "@/lib/expert/formation-proposals";

export const dynamic = "force-dynamic";

export default async function ProposeFormationPage() {
  const session = await getSession();
  const proposals = session?.id ? await listExpertFormationProposals(session.id) : [];

  return (
    <ExpertPageFrame>
      <ExpertPageHeader
        title="Proposer une formation"
        subtitle="Décrivez la formation à intégrer au catalogue Byound. Une personne de l'équipe la relit dans l'espace super admin."
      />
      <ProposeFormationForm proposals={proposals} />
    </ExpertPageFrame>
  );
}
