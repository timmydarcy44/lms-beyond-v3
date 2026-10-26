import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { formatEntrepriseOtp } from "@/lib/emails/templates/entreprise-otp";
import { grantUserRole, type AccountRole } from "@/lib/auth/user-roles";
import { publicAppUrl } from "@/lib/env";

const RESEND_GAP_MS = 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;

export type AccessContext =
  | "tuteur_new"
  | "tuteur_existing"
  | "tuteur_notice"
  | "tuteur_login"
  | "apprenant_admitted_new"
  | "apprenant_admitted_existing"
  | "application_linked";

const CODE_CONTEXTS = new Set<AccessContext>(["tuteur_new", "tuteur_login", "apprenant_admitted_new"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shell(title: string, body: string, code?: string) {
  const block = code
    ? `<p style="margin:28px 0 0;font-size:36px;font-weight:800;letter-spacing:4px;">${escapeHtml(formatEntrepriseOtp(code))}</p><p style="color:#5C6370;">Valable 10 minutes.</p>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111;padding:32px;"><p style="font-weight:800;">Byound</p><h1 style="font-size:28px;">${title}</h1>${body}${block}</div>`;
}

function message(input: {
  context: AccessContext;
  firstName: string;
  learnerName: string;
  companyName: string;
  cfaName: string;
  code?: string;
  accessUrl?: string;
}) {
  const learner = escapeHtml(input.learnerName || "cet alternant");
  const company = escapeHtml(input.companyName || "son entreprise");
  const cfa = escapeHtml(input.cfaName);
  if (input.context === "tuteur_new") {
    return {
      subject: `${input.cfaName} vous a désigné tuteur`,
      html: shell(
        "Votre espace tuteur",
        `<p>${cfa} vous a désigné tuteur de ${learner} chez ${company}.</p>`,
        input.code,
      ),
    };
  }
  if (input.context === "tuteur_notice") {
    const href = escapeHtml(input.accessUrl || "https://www.byound.fr/tuteur/connexion");
    return {
      subject: `${input.cfaName} vous a désigné tuteur`,
      html: shell(
        "Vous êtes tuteur",
        `<p>${cfa} vous a désigné tuteur de ${learner} chez ${company}.</p><p style="margin-top:24px;"><a href="${href}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:800;">Indiquer mon e-mail</a></p><p style="color:#5C6370;">La page demande votre adresse e-mail, puis « Envoyer un code ». Le code ouvre l'espace tuteur.</p>`,
      ),
    };
  }
  if (input.context === "tuteur_login") {
    return {
      subject: "Votre code pour l'espace tuteur",
      html: shell("Votre code", "<p>Utilisez ce code pour ouvrir votre espace tuteur.</p>", input.code),
    };
  }
  if (input.context === "tuteur_existing") {
    return {
      subject: `${input.learnerName} vous est confié`,
      html: shell("Nouvel alternant", `<p>${learner} vous est confié chez ${company}.</p>`),
    };
  }
  if (input.context === "apprenant_admitted_new") {
    return {
      subject: "Vous êtes admis chez Byound School",
      html: shell("Vous êtes admis chez Byound School", `<p>Bonjour ${escapeHtml(input.firstName)}, votre espace est prêt.</p>`, input.code),
    };
  }
  if (input.context === "apprenant_admitted_existing") {
    return {
      subject: "Votre parcours Byound School est disponible",
      html: shell("Parcours disponible", `<p>Votre parcours est disponible dans votre espace.</p>`),
    };
  }
  return {
    subject: "Votre candidature est rattachée à votre compte Byound",
    html: shell("Candidature rattachée", `<p>Votre candidature est rattachée à votre compte Byound.</p>`),
  };
}

async function ensureAuthUser(
  db: SupabaseClient,
  input: { email: string; firstName: string; lastName: string; role: AccountRole },
): Promise<string | null> {
  const created = await db.auth.admin.createUser({
    email: input.email,
    email_confirm: false,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: `${input.firstName} ${input.lastName}`.trim(),
      role_type: input.role,
      account_type: input.role,
      needs_password_setup: true,
    },
  });
  const id = created.data.user?.id ?? null;
  if (id) {
    await grantUserRole(db, id, input.role);
    return id;
  }
  const message = created.error?.message ?? "";
  if (!message.toLowerCase().includes("already") && (created.error as { code?: string } | null)?.code !== "email_exists") {
    console.error("[access-code] createUser", message);
    return null;
  }
  const profile = await db.from("profiles").select("id").ilike("email", input.email).maybeSingle();
  const existingId = String((profile.data as { id?: string } | null)?.id ?? "");
  if (existingId) await grantUserRole(db, existingId, input.role);
  return existingId || null;
}

export async function sendAccessCode(
  db: SupabaseClient,
  input: {
    email: string;
    role: AccountRole;
    context: AccessContext;
    firstName: string;
    lastName: string;
    learnerName?: string;
    companyName?: string;
    cfaName?: string;
  },
): Promise<{ ok: true; digits?: number } | { ok: false; error: string; retryAfter?: number }> {
  const email = input.email.trim().toLowerCase();
  const needsCode = CODE_CONTEXTS.has(input.context);
  let code: string | undefined;

  if (needsCode) {
    const open = await db
      .from("signup_requests")
      .select("id, last_sent_at")
      .eq("email", email)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const last = (open.data as { last_sent_at?: string | null } | null)?.last_sent_at ?? null;
    if (last) {
      const wait = RESEND_GAP_MS - (Date.now() - new Date(last).getTime());
      if (wait > 0) return { ok: false, error: "Patientez avant de renvoyer un code.", retryAfter: Math.ceil(wait / 1000) };
    }
    await ensureAuthUser(db, { email, firstName: input.firstName, lastName: input.lastName, role: input.role });
    const link = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${publicAppUrl()}${input.role === "tuteur" ? "/dashboard/tuteur" : "/dashboard/apprenant"}` },
    });
    code = link.data?.properties?.email_otp?.trim();
    if (link.error || !code) return { ok: false, error: "Le code n'a pas pu être préparé." };
    const now = new Date().toISOString();
    const payload = {
      email,
      first_name: input.firstName,
      last_name: input.lastName,
      company: input.context.startsWith("tuteur") ? "context:tuteur" : "context:apprenant",
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      last_sent_at: now,
      otp_type: link.data.properties?.verification_type === "signup" ? "signup" : "magiclink",
      mode: "login" as const,
      user_id: link.data.user?.id ?? null,
      attempts: 0,
      locked_until: null,
    };
    const row = open.data as { id?: string } | null;
    const write = row?.id
      ? await db.from("signup_requests").update(payload).eq("id", row.id)
      : await db.from("signup_requests").insert(payload);
    if (write.error) return { ok: false, error: "Le code n'a pas pu être enregistré." };
  } else if (input.context !== "application_linked" && input.context !== "tuteur_notice") {
    const profile = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    const existingId = String((profile.data as { id?: string } | null)?.id ?? "");
    if (existingId) await grantUserRole(db, existingId, input.role);
  }

  const copy = message({
    context: input.context,
    firstName: input.firstName,
    learnerName: input.learnerName || `${input.firstName} ${input.lastName}`.trim(),
    companyName: input.companyName || "",
    cfaName: input.cfaName || "Byound School",
    code,
    accessUrl: `${publicAppUrl()}/tuteur/connexion?email=${encodeURIComponent(email)}`,
  });
  const sent = await sendEmail({ to: email, subject: copy.subject, html: copy.html, from: EDGE_COCKPIT_FROM, skipBcc: true });
  if (!sent.success) return { ok: false, error: "L'email n'a pas pu être envoyé." };
  return { ok: true, digits: code ? code.replace(/\D/g, "").length || 8 : undefined };
}
