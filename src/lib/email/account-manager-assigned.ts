import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendOrgTrackedEmail } from "@/lib/email/org-outbound";
import { sendEmail } from "@/lib/email/resend-client";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { publicAppUrl } from "@/lib/env";

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value)}</td>
  </tr>`;
}

/** Accueille un nouveau gestionnaire de compte à sa création. */
export async function notifyAccountManagerWelcome(params: {
  firstName: string;
  lastName?: string | null;
  email: string;
}): Promise<{ sent: boolean; error?: string }> {
  const to = String(params.email ?? "")
    .trim()
    .toLowerCase();
  if (!to.includes("@")) return { sent: false, error: "E-mail invalide" };

  const firstName = String(params.firstName ?? "").trim() || "Bonjour";
  const fullName = [params.firstName, params.lastName].filter(Boolean).join(" ").trim();
  const html = buildEdgeEmailShell({
    title: "Bienvenue chez Byound",
    preheader: "Vous êtes désormais gestionnaire de compte.",
    bodyHtml: `${edgeEmailParagraph(`Bonjour ${firstName},`)}${edgeEmailParagraph(
      "Nous avons l'honneur de vous accueillir comme gestionnaire de compte.",
    )}${edgeEmailParagraph(
      "Vous pourrez bientôt recevoir des comptes clients sous votre responsabilité, ainsi que les notifications liées aux devis et conventions.",
    )}${
      fullName
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;margin:8px 0 0;">
        ${row("Profil", fullName)}
        ${row("E-mail", to)}
      </table>`
        : ""
    }`,
    footerNote: "Notification Byound Control — création d'un gestionnaire de compte",
  });

  const result = await sendEmail({
    to,
    from: EDGE_COCKPIT_FROM,
    subject: "Bienvenue — gestionnaire de compte Byound",
    html,
    tags: {
      type: "account-manager-welcome",
    },
  });

  if (!result.success) {
    console.warn("[account-manager-welcome]", result.error);
    return { sent: false, error: result.error };
  }
  return { sent: true };
}

/** Notifie le gestionnaire qu'un compte client lui a été assigné. */
export async function notifyAccountManagerAssigned(
  service: SupabaseClient,
  params: {
    orgId: string;
    managerId: string;
    assignedByUserId?: string | null;
  },
): Promise<{ sent: boolean; error?: string }> {
  const [{ data: org }, { data: manager }] = await Promise.all([
    service
      .from("organizations")
      .select(
        "id, name, slug, siret, status, kind, client_since, address_line, address_zip, address_city, address_country",
      )
      .eq("id", params.orgId)
      .maybeSingle(),
    service
      .from("account_managers")
      .select("id, first_name, last_name, email, is_active")
      .eq("id", params.managerId)
      .maybeSingle(),
  ]);

  if (!org) return { sent: false, error: "Compte introuvable" };
  if (!manager || manager.is_active === false) {
    return { sent: false, error: "Gestionnaire introuvable" };
  }

  const to = String(manager.email ?? "")
    .trim()
    .toLowerCase();
  if (!to.includes("@")) return { sent: false, error: "E-mail gestionnaire manquant" };

  const firstName =
    String(manager.first_name ?? "").trim() ||
    String(manager.last_name ?? "").trim() ||
    "Bonjour";
  const company = String(org.name ?? "Compte client").trim() || "Compte client";
  const address = [org.address_line, [org.address_zip, org.address_city].filter(Boolean).join(" "), org.address_country]
    .filter(Boolean)
    .join(", ");
  const accountUrl = `${publicAppUrl().replace(/\/$/, "")}/super/organisations/${org.id}`;
  const statusLabel =
    org.status === "active"
      ? "Actif"
      : org.status === "demo"
        ? "Démo"
        : org.status === "trial"
          ? "Essai"
          : "À configurer";

  const html = buildEdgeEmailShell({
    title: "Un nouveau compte vous a été assigné",
    preheader: `${company} est maintenant sous votre responsabilité.`,
    bodyHtml: `${edgeEmailParagraph(`Bonjour ${firstName},`)}${edgeEmailParagraph(
      "Un nouveau compte client vient de vous être assigné sur Byound Control.",
    )}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;margin:8px 0 0;">
        ${row("Entreprise", company)}
        ${org.siret ? row("SIRET", String(org.siret)) : ""}
        ${address ? row("Adresse", address) : ""}
        ${row("Statut", statusLabel)}
        ${org.kind ? row("Type", String(org.kind)) : ""}
        ${org.client_since ? row("Client depuis", new Date(String(org.client_since)).toLocaleDateString("fr-FR")) : ""}
        ${org.slug ? row("Slug", String(org.slug)) : ""}
      </table>`,
    cta: { label: "Ouvrir la fiche client", href: accountUrl },
    footerNote: "Notification Byound Control — assignation de compte",
  });

  const result = await sendOrgTrackedEmail({
    orgId: params.orgId,
    kind: "other",
    label: "Assignation gestionnaire de compte",
    db: service,
    actorUserId: params.assignedByUserId ?? null,
    meta: {
      event: "account_manager_assigned",
      manager_id: params.managerId,
    },
    to,
    from: EDGE_COCKPIT_FROM,
    subject: `Un nouveau compte vous a été assigné — ${company}`,
    html,
    tags: {
      type: "account-manager-assigned",
      organization_id: params.orgId,
      manager_id: params.managerId,
    },
  });

  if (!result.success) {
    console.warn("[account-manager-assigned]", result.error);
    return { sent: false, error: result.error };
  }
  return { sent: true };
}
