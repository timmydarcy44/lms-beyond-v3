import { sendEmail } from "@/lib/email/resend-client";
import { getCollaboratorTestEmail } from "@/lib/emails/templates/collaborator-mail";
import { getServiceRoleClient } from "@/lib/supabase/server";

const LABELS = {
  disc: "test comportemental",
  idmc: "test IDMC",
  soft_skills: "test soft skills",
} as const;

export type CollaboratorTestKind = keyof typeof LABELS;

export async function notifyCollaboratorTestComplete(params: {
  userId: string;
  email?: string | null;
  test: CollaboratorTestKind;
}) {
  const service = getServiceRoleClient();
  if (!service) return;

  let email = params.email?.trim().toLowerCase() || "";
  let firstName = "";
  let companyName: string | null = null;

  const byProfile = await service
    .from("employees")
    .select("email, first_name, company_id")
    .eq("profile_id", params.userId)
    .maybeSingle();

  let employee = byProfile.data;
  if (!employee && email) {
    const byEmail = await service
      .from("employees")
      .select("email, first_name, company_id")
      .eq("email", email)
      .maybeSingle();
    employee = byEmail.data;
  }

  if (employee) {
    email = String(employee.email ?? email).trim().toLowerCase();
    firstName = String(employee.first_name ?? "");
    if (employee.company_id) {
      const { data: org } = await service
        .from("organizations")
        .select("name")
        .eq("id", employee.company_id)
        .maybeSingle();
      companyName = org?.name ? String(org.name) : null;
    }
  }

  if (!email.includes("@")) return;

  const mail = getCollaboratorTestEmail({
    firstName,
    testLabel: LABELS[params.test],
    companyName,
  });
  const sent = await sendEmail({ to: email, subject: mail.subject, html: mail.html });
  if (!sent.success) {
    console.error("[test-complete] resend", email, sent.error);
  }
}
