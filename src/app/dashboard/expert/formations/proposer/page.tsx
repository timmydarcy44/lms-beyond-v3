import { ExpertPageFrame, ExpertPageHeader } from "@/components/expert/expert-ui";
import { ProposeFormationForm } from "@/components/expert/propose-formation-form";
import { listExpertFormationProposals, requireExpertWriter } from "@/lib/expert/formation-proposals";

export const dynamic = "force-dynamic";

export default async function ProposeFormationPage() {
  const expert = await requireExpertWriter();
  const proposals = expert.ok ? await listExpertFormationProposals(expert.expertId) : [];

  return (
    <ExpertPageFrame>
      <ExpertPageHeader
        title="Proposer une formation"
        subtitle="Décrivez la formation à intégrer au catalogue Byound. L'envoi prévient l'équipe."
      />
      <ProposeFormationForm proposals={proposals} />
    </ExpertPageFrame>
  );
}
