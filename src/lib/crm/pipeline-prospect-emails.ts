import { sendEmail } from "@/lib/email/resend-client";
import { pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";

type NewProspectEmailInput = {
  company_name: string;
  contact_first_name?: string | null;
  email?: string | null;
  phone?: string | null;
  stage_slug?: string | null;
  contact_owner_email?: string | null;
  siret?: string | null;
  opco_name?: string | null;
  deal_id: string;
};

const NOTIFY_RECIPIENTS = ["jerome.picot@edgebs.fr", "timmydarcy44@gmail.com"] as const;

export async function sendNewPipelineProspectNotification(
  input: NewProspectEmailInput,
): Promise<void> {
  const owner = pipelineOwnerLabel(input.contact_owner_email);
  const contact = [input.contact_first_name, input.email, input.phone].filter(Boolean).join(" · ") || "—";
  const siretLine = input.siret ? `<p><strong>SIRET :</strong> ${input.siret}</p>` : "";
  const opcoLine = input.opco_name ? `<p><strong>OPCO :</strong> ${input.opco_name}</p>` : "";
  const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://beyond.edgebs.fr"}/super/crm/pipeline-btob/${input.deal_id}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">Nouveau prospect BTOB</h2>
      <p><strong>Entreprise :</strong> ${input.company_name}</p>
      <p><strong>Contact :</strong> ${contact}</p>
      <p><strong>Étape :</strong> ${input.stage_slug ?? "a_appeler"}</p>
      <p><strong>Propriétaire :</strong> ${owner}</p>
      ${siretLine}
      ${opcoLine}
      <p style="margin-top: 16px;">
        <a href="${dealUrl}" style="color: #4f46e5;">Voir la fiche prospect →</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: [...NOTIFY_RECIPIENTS],
    subject: `Nouveau prospect : ${input.company_name}`,
    html,
    from: "Beyond CRM <darcy@edgebs.fr>",
    skipBcc: true,
  });
}
