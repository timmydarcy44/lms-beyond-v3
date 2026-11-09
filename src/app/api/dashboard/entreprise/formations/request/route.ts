import { NextRequest, NextResponse } from "next/server";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { BUSINESS_TRAINING_ITEMS } from "@/lib/enterprise/business-training-catalog";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { resolveAndStoreOrganizationOpco } from "@/lib/entreprise/resolve-organization-opco";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CONTACT_TO = "contact@byound.fr";
const CONTACT_BCC = "timmydarcy44@gmail.com";

type SelectedEmployee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
};

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#8A8A8A;vertical-align:top;width:160px;">${escapeEdgeEmailHtml(label)}</td>
    <td style="padding:8px 0;font-size:15px;color:#111111;font-weight:500;">${escapeEdgeEmailHtml(value).replace(/\n/g, "<br/>")}</td>
  </tr>`;
}

function employeeLabel(emp: SelectedEmployee) {
  const name = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim();
  if (name && emp.email) return `${name} <${emp.email}>`;
  return name || emp.email || emp.id;
}

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({ error: "Organisation requise" }, { status: 400 });
  }
  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const trainingId = String(body.training_id ?? "").trim();
  const contactName = String(body.contact_name ?? "").trim();
  const contactEmail = String(body.contact_email ?? "").trim().toLowerCase();
  const contactPhone = String(body.contact_phone ?? "").trim();
  const preferredFormat = String(body.preferred_format ?? "").trim();
  const preferredPeriod = String(body.preferred_period ?? "").trim();
  const preferredLocation = String(body.preferred_location ?? "").trim();
  const fundingRaw = String(body.funding_type ?? "direct").trim().toLowerCase();
  const fundingType = fundingRaw === "opco" ? "opco" : "direct";
  const notes = String(body.notes ?? body.message ?? "").trim();

  const rawIds = Array.isArray(body.participant_ids)
    ? body.participant_ids
    : Array.isArray(body.employee_ids)
      ? body.employee_ids
      : [];
  const participantIds = [
    ...new Set(
      rawIds
        .map((id) => String(id ?? "").trim())
        .filter((id) => id && !id.startsWith("demo-") && !id.startsWith("demo_")),
    ),
  ];

  // Compat ancien formulaire « nombre de participants »
  const legacyParticipants = String(body.participants ?? "").trim();

  if (!trainingId || !contactName || !contactEmail) {
    return NextResponse.json(
      { error: "Formation et contact sont requis." },
      { status: 400 },
    );
  }

  if (!participantIds.length && !legacyParticipants) {
    return NextResponse.json(
      { error: "Sélectionnez au moins un collaborateur participant." },
      { status: 400 },
    );
  }

  if (!contactEmail.includes("@")) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const training = BUSINESS_TRAINING_ITEMS.find((item) => item.id === trainingId);
  if (!training) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }

  let companyName = "";
  let orgSiret = "";
  let opcoName: string | null = null;
  const service = getServiceRoleClient();
  let selectedEmployees: SelectedEmployee[] = [];

  if (service) {
    let orgQuery = await service
      .from("organizations")
      .select("name, siret, opco_name, opco_source")
      .eq("id", access.organizationId)
      .maybeSingle();
    if (orgQuery.error && /opco_/i.test(orgQuery.error.message)) {
      orgQuery = await service
        .from("organizations")
        .select("name, siret")
        .eq("id", access.organizationId)
        .maybeSingle();
    }
    const org = orgQuery.data as {
      name?: string | null;
      siret?: string | null;
      opco_name?: string | null;
      opco_source?: string | null;
    } | null;
    companyName = String(org?.name ?? "").trim();
    orgSiret = String(org?.siret ?? "").replace(/\D/g, "");
    opcoName = String(org?.opco_name ?? "").trim() || null;

    if (fundingType === "opco" && orgSiret.length === 14) {
      const resolved = await resolveAndStoreOrganizationOpco(
        service,
        access.organizationId,
        orgSiret,
        {
          existingName: org?.opco_name,
          existingSource: org?.opco_source,
        },
      );
      opcoName = resolved.opco_name;
    }

    if (participantIds.length) {
      const { data: employees, error: empErr } = await service
        .from("employees")
        .select("id, first_name, last_name, email, job_title")
        .eq("company_id", access.organizationId)
        .in("id", participantIds);
      if (empErr) {
        return NextResponse.json({ error: empErr.message }, { status: 400 });
      }
      selectedEmployees = (employees ?? []) as SelectedEmployee[];
      if (selectedEmployees.length !== participantIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs collaborateurs sélectionnés sont introuvables." },
          { status: 400 },
        );
      }
    }
  }
  if (!companyName) {
    companyName = "Entreprise Byound";
  }

  const qty = Math.max(
    1,
    selectedEmployees.length ||
      Number.parseInt(legacyParticipants.replace(/\D/g, ""), 10) ||
      1,
  );
  const participantsLabel = selectedEmployees.length
    ? selectedEmployees.map(employeeLabel).join("\n")
    : legacyParticipants;

  const viewerLabel = [access.viewer.prenom, access.viewer.nom].filter(Boolean).join(" ").trim();

  const html = buildEdgeEmailShell({
    title: "Demande de formation entreprise",
    preheader: `${companyName} — ${training.title}`,
    bodyHtml: `
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Une entreprise a demandé une session via le dashboard Byound.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
        ${row("Formation", training.title)}
        ${row("Catégorie", training.category)}
        ${row("Durée / niveau", `${training.duration} · ${training.level}`)}
        ${row("Catalogue", `${training.format} · à partir de ${training.startingPrice}`)}
        ${row("Entreprise", companyName)}
        ${orgSiret ? row("SIRET", orgSiret) : ""}
        ${row("Contact", contactName)}
        ${row("Email", contactEmail)}
        ${contactPhone ? row("Téléphone", contactPhone) : ""}
        ${row("Participants", `${qty} —\n${participantsLabel}`)}
        ${preferredFormat ? row("Format souhaité", preferredFormat) : ""}
        ${preferredPeriod ? row("Période souhaitée", preferredPeriod) : ""}
        ${row(
          "Financement",
          fundingType === "opco"
            ? opcoName
              ? `OPCO — ${opcoName}`
              : "OPCO"
            : "Fonds propres",
        )}
        ${preferredLocation ? row("Lieu souhaité", preferredLocation) : ""}
        ${notes ? row("Précisions", notes) : ""}
        ${row("Compte connecté", viewerLabel || access.viewer.email || "—")}
        ${row("Org ID", access.organizationId)}
      </table>`,
    footerNote: "Demande générée depuis /dashboard/entreprise/formations/demander",
  });

  const result = await sendEmail({
    to: CONTACT_TO,
    bcc: CONTACT_BCC,
    skipBcc: true,
    replyTo: contactEmail,
    from: EDGE_COCKPIT_FROM,
    subject: `[Byound Formations] ${companyName} — ${training.title}`,
    html,
    tags: {
      type: "entreprise-formation-request",
      org_id: access.organizationId,
    },
  });

  if (!result.success) {
    console.error("[entreprise/formations/request] email error:", result.error);
    return NextResponse.json(
      { error: result.error || "Impossible d'envoyer la demande." },
      { status: 502 },
    );
  }

  let dossierId: string | null = null;
  try {
    const { createFormationDossier } = await import("@/lib/formation-dossier/create-dossier");
    const {
      amountsFromHtCents,
      quoteHtCentsFromCatalog,
    } = await import("@/lib/formation-dossier/catalog-pricing");
    const { ensureLearnerProfileByEmail } = await import(
      "@/lib/formation-dossier/ensure-learner"
    );
    if (service) {
      let trainingCourseId: string | null = null;
      let intraPrice: number | null = null;
      let interPrice: number | null = null;
      const { data: matchedCourse } = await service
        .from("training_courses")
        .select("id, title, intra_price, inter_price")
        .ilike("title", training.title)
        .limit(1)
        .maybeSingle();
      if (matchedCourse?.id) {
        trainingCourseId = String(matchedCourse.id);
        intraPrice =
          matchedCourse.intra_price != null ? Number(matchedCourse.intra_price) : null;
        interPrice =
          matchedCourse.inter_price != null ? Number(matchedCourse.inter_price) : null;
      }
      const ht =
        quoteHtCentsFromCatalog({
          intraPrice,
          interPrice,
          startingPriceLabel: training.startingPrice,
          modality: "intra",
          participants: qty,
        }) ?? null;
      const amounts = amountsFromHtCents(ht);
      const modalityPresence =
        preferredFormat.toLowerCase().includes("distan")
          ? "distanciel"
          : preferredFormat.toLowerCase().includes("blend")
            ? "hybride"
            : "presentiel";

      const dossier = await createFormationDossier(service, {
        organizationId: access.organizationId,
        source: "dashboard_request",
        trainingCourseId,
        courseTitle: training.title,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        amountHtCents: amounts?.ht ?? null,
        amountTvaCents: amounts?.tva ?? null,
        amountTtcCents: amounts?.ttc ?? null,
        modalityIntraInter: "intra",
        modalityPresence,
        fundingType,
        opcoName: fundingType === "opco" ? opcoName : null,
        notes: [
          preferredFormat ? `Format: ${preferredFormat}` : null,
          preferredPeriod ? `Période: ${preferredPeriod}` : null,
          preferredLocation ? `Lieu: ${preferredLocation}` : null,
          `Financement: ${
            fundingType === "opco"
              ? opcoName
                ? `OPCO — ${opcoName}`
                : "OPCO"
              : "fonds propres"
          }`,
          fundingType === "opco" && opcoName ? `OPCO: ${opcoName}` : null,
          orgSiret ? `SIRET: ${orgSiret}` : null,
          `Participants (${qty}):`,
          ...selectedEmployees.map((emp) => `- ${employeeLabel(emp)}`),
          !selectedEmployees.length && legacyParticipants
            ? `Participants: ${legacyParticipants}`
            : null,
          notes || null,
        ]
          .filter(Boolean)
          .join("\n"),
        createdBy: access.userId ?? null,
        ownerUserId: access.userId ?? null,
      });
      dossierId = dossier.id;

      // Session brouillon avec le lieu choisi (dates à caler ensuite)
      if (preferredLocation || modalityPresence === "distanciel") {
        try {
          const { resolveTrainingLocationLabel } = await import(
            "@/lib/formation-documents/resolve-location"
          );
          const { data: orgAddr } = await service
            .from("organizations")
            .select("address_line, address_zip, address_city")
            .eq("id", access.organizationId)
            .maybeSingle();
          const locationLabel = resolveTrainingLocationLabel({
            notesLocation: preferredLocation || null,
            modalityPresence,
            organization: orgAddr,
          });
          const { data: sess } = await service
            .from("formation_sessions")
            .insert({
              title: training.title,
              modality_presence: modalityPresence,
              location_label: locationLabel,
              status: "draft",
            })
            .select("id")
            .single();
          if (sess?.id) {
            await service
              .from("formation_dossiers")
              .update({ session_id: sess.id, updated_at: new Date().toISOString() })
              .eq("id", dossier.id);
          }
        } catch (err) {
          console.warn(
            "[entreprise/formations/request] session lieu:",
            err instanceof Error ? err.message : err,
          );
        }
      }

      for (const emp of selectedEmployees) {
        const email = String(emp.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) continue;
        try {
          const learner = await ensureLearnerProfileByEmail(service, {
            email,
            firstName: emp.first_name,
            lastName: emp.last_name,
            organizationId: access.organizationId,
            jobTitle: emp.job_title,
          });
          await service.from("formation_participants").upsert(
            {
              dossier_id: dossier.id,
              profile_id: learner.profileId,
              job_title: emp.job_title,
            },
            { onConflict: "dossier_id,profile_id" },
          );
        } catch (err) {
          console.warn(
            "[entreprise/formations/request] participant:",
            emp.email,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
  } catch (err) {
    console.warn(
      "[entreprise/formations/request] dossier:",
      err instanceof Error ? err.message : err,
    );
  }

  // Accusé de réception au demandeur
  const ackHtml = buildEdgeEmailShell({
    title: "Demande bien reçue",
    preheader: `Votre demande — ${training.title}`,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Bonjour ${escapeEdgeEmailHtml(contactName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Nous avons bien reçu votre demande de formation
        <strong>${escapeEdgeEmailHtml(training.title)}</strong>
        pour <strong>${escapeEdgeEmailHtml(companyName)}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Un conseiller Byound revient vers vous rapidement avec un devis et les prochaines étapes
        (dates, participants, financement).
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align:left;">
        ${row("Formation", training.title)}
        ${row("Participants", `${qty} —\n${participantsLabel}`)}
        ${preferredFormat ? row("Format souhaité", preferredFormat) : ""}
        ${preferredPeriod ? row("Période souhaitée", preferredPeriod) : ""}
      </table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#8A8A8A;">
        Besoin d'ajouter une précision ? Répondez à cet e-mail.
      </p>`,
    footerNote: "Byound — confirmation de demande formation",
  });

  const ack = await sendEmail({
    to: contactEmail,
    skipBcc: true,
    from: EDGE_COCKPIT_FROM,
    replyTo: CONTACT_TO,
    subject: `Demande bien reçue — ${training.title}`,
    html: ackHtml,
    tags: {
      type: "entreprise-formation-request-ack",
      org_id: access.organizationId,
    },
  });
  if (!ack.success) {
    console.warn("[entreprise/formations/request] ack email:", ack.error);
  }

  return NextResponse.json({
    success: true,
    messageId: result.messageId,
    ackMessageId: ack.messageId ?? null,
    dossierId,
    participants: qty,
  });
}
