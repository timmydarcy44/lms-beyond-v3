import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";
import { provisionExpertAuthUser } from "@/lib/expert/provision-expert-auth";
import { provisionExpertSignup } from "@/lib/expert/provision-expert-signup";
import { expertSetPasswordUrl } from "@/lib/expert/signup-redirect";
import { upsertExpertRegistration } from "@/lib/expert/upsert-expert-registration";
import { appOrigin } from "@/lib/onboarding/slug";

async function generatePasswordSetupLink(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<string | null> {
  for (const type of ["recovery", "magiclink", "invite", "signup"] as const) {
    const { data, error } = await supabase.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo },
    });
    if (!error && data?.properties?.action_link) return data.properties.action_link;
  }
  return null;
}

/**
 * Relie une fiche school_instructors au workflow Expert existant
 * (auth + experts + set-password → /dashboard/expert).
 */
export async function inviteSchoolInstructorAsExpert(
  db: SupabaseClient,
  params: {
    instructorId: string;
    email: string;
    firstName: string;
    lastName: string;
    expertise?: string[];
    schoolName?: string;
  },
): Promise<{
  ok: boolean;
  expertId?: string;
  userId?: string;
  emailSent?: boolean;
  error?: string;
  passwordSetupLink?: string;
}> {
  const email = params.email.trim().toLowerCase();
  const origin = appOrigin();
  const redirectTo = expertSetPasswordUrl(origin);

  const auth = await provisionExpertAuthUser(db, {
    email,
    firstName: params.firstName,
    lastName: params.lastName,
    redirectTo,
  });
  if (!auth.ok) return { ok: false, error: auth.error };

  const signup = await provisionExpertSignup(db, {
    userId: auth.userId,
    email,
    firstName: params.firstName,
    lastName: params.lastName,
  });
  if (!signup.ok) {
    // continuer même si profile déjà expert
    console.warn("[inviteSchoolInstructorAsExpert] provisionExpertSignup", signup.error);
  }

  const expertUpsert = await upsertExpertRegistration(db, {
    id: auth.userId,
    email,
    first_name: params.firstName,
    last_name: params.lastName,
    headline: null,
    is_active: false,
    specialties: params.expertise?.length ? params.expertise : null,
    formats_supported: null,
    review_status: "pending_review",
    wants_certification: false,
    linkedin_url: null,
    references: [],
  });
  if (!expertUpsert.ok) {
    console.warn("[inviteSchoolInstructorAsExpert] upsertExpert", expertUpsert.error);
  }

  await db
    .from("school_instructors")
    .update({
      profile_id: auth.userId,
      expert_id: auth.userId,
      expert_invite_status: "invited",
      status: "invited",
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.instructorId);

  const passwordSetupLink =
    (await generatePasswordSetupLink(db, email, redirectTo)) || redirectTo;

  const schoolLabel = params.schoolName?.trim() || "votre école EDGE";
  const html = buildEdgeEmailShell({
    title: "Activez votre espace EDGE Expert",
    preheader: "Créez votre mot de passe pour accéder à votre espace formateur",
    bodyHtml: `<p>Bonjour ${params.firstName || ""},</p>
      <p>${schoolLabel} vous invite à rejoindre EDGE en tant qu'Expert / formateur.</p>
      <p>Activez votre espace, définissez votre mot de passe, puis accédez à votre dashboard Expert.</p>`,
    cta: { label: "Activer mon espace Expert", href: passwordSetupLink },
  });

  const mail = await sendEmail({
    to: email,
    subject: "Activez votre espace EDGE Expert",
    html,
    from: EDGE_COCKPIT_FROM,
  });

  return {
    ok: true,
    expertId: auth.userId,
    userId: auth.userId,
    emailSent: Boolean(mail.success),
    passwordSetupLink: process.env.NODE_ENV === "development" ? passwordSetupLink : undefined,
  };
}
