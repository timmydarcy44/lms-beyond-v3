import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { getCollaboratorInviteEmail } from "@/lib/emails/templates/collaborator-mail";
import {
  buildCollaboratorInviteMetadata,
  buildCollaboratorSetPasswordUrl,
} from "@/lib/entreprise/collaborator-invite";
import { syncCollaboratorProfileAfterInvite } from "@/lib/entreprise/sync-collaborator-profile";
import { publicAppUrl } from "@/lib/env";

type Service = SupabaseClient;

function actionLink(data: { properties?: { action_link?: string }; user?: { id?: string } } | null) {
  return data?.properties?.action_link ?? null;
}

export async function deliverCollaboratorInvite(
  service: Service,
  params: {
    email: string;
    firstName: string;
    lastName?: string;
    companyName: string;
    organizationId: string;
    employeeId: string;
  },
): Promise<{ sent: boolean; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const redirectTo = buildCollaboratorSetPasswordUrl(publicAppUrl());
  const metadata = buildCollaboratorInviteMetadata({
    firstName: params.firstName,
    lastName: params.lastName,
    organizationId: params.organizationId,
    employeeId: params.employeeId,
  });

  const invite = await service.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo, data: metadata },
  });

  let link = actionLink(invite.data);
  let userId = invite.data?.user?.id ?? null;

  if (!link) {
    const magic = await service.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo, data: metadata },
    });
    link = actionLink(magic.data);
    userId = userId ?? magic.data?.user?.id ?? null;
    if (!link) {
      const message = magic.error?.message || invite.error?.message || "Lien d'invitation indisponible";
      console.error("[collaborator-invite] generateLink", email, message);
      return { sent: false, error: message };
    }
  }

  if (userId) {
    await service.auth.admin.updateUserById(userId, { user_metadata: metadata });
    await syncCollaboratorProfileAfterInvite(service, {
      userId,
      email,
      firstName: params.firstName,
      lastName: params.lastName ?? "",
      organizationId: params.organizationId,
      employeeId: params.employeeId,
    });
  }

  const mail = getCollaboratorInviteEmail({
    firstName: params.firstName,
    companyName: params.companyName,
    inviteLink: link,
  });
  const sent = await sendEmail({ to: email, subject: mail.subject, html: mail.html });
  if (!sent.success) {
    console.error("[collaborator-invite] resend", email, sent.error);
    return { sent: false, error: sent.error ?? "Envoi Resend refusé" };
  }
  return { sent: true };
}
