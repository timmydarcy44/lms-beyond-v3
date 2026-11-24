import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isHandicapPortfolioOnlyRoleType } from "@/lib/auth/school-role-type-guards";
import { loadBtocClientFile } from "@/lib/control/btoc-client-file";
import { createFormationDossier } from "@/lib/formation-dossier/create-dossier";
import { sendAssessmentInvites } from "@/lib/formation-assessments/send";
import { sendCrmUserPasswordInvite } from "@/lib/crm/send-crm-user-password-invite";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidFrPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 0 || /^(?:0|\+33|33)[1-9]\d{8}$/.test(digits.replace(/^33/, "0"));
}

function isValidPostal(value: string) {
  return value.length === 0 || /^\d{5}$/.test(value.trim());
}

/** Super admin ou référente handicap uniquement — jamais pour un admin standard. */
async function canViewAdaptation(): Promise<boolean> {
  if (await isSuperAdmin()) return true;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const service = getServiceRoleClient();
  if (!service) return false;
  const { data: profile } = await service
    .from("profiles")
    .select("role_type")
    .eq("id", data.user.id)
    .maybeSingle();
  return isHandicapPortfolioOnlyRoleType((profile as { role_type?: string } | null)?.role_type);
}

async function requireStaff() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return { ok: false as const, status: 403 as const, error: "Réservé au staff Byound" };
  }
  const service = getServiceRoleClient();
  if (!service) {
    return { ok: false as const, status: 503 as const, error: "Service indisponible" };
  }
  return { ok: true as const, service, staffId: data.user.id };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await requireStaff();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: userId } = await ctx.params;
  const client = await loadBtocClientFile(auth.service, userId, {
    canViewAdaptation: await canViewAdaptation(),
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaff();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: userId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const postal = String(body.postal_code ?? "").trim();
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (phone && !isValidFrPhone(phone)) {
    return NextResponse.json({ error: "Téléphone FR invalide" }, { status: 400 });
  }
  if (postal && !isValidPostal(postal)) {
    return NextResponse.json({ error: "Code postal invalide (5 chiffres)" }, { status: 400 });
  }

  const firstName = String(body.first_name ?? "").trim();
  const lastName = String(body.last_name ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  const fundingRaw = String(body.funding_type ?? "").trim();
  const fundingType =
    fundingRaw === "fonds_propres" || fundingRaw === "cpf" || fundingRaw === "autre"
      ? fundingRaw
      : null;

  const addressLine = String(body.address_line ?? "").trim() || null;
  const city = String(body.city ?? "").trim() || null;
  const coords = {
    address_line: addressLine,
    postal_code: postal || null,
    city,
    funding_type: fundingType,
  };

  const patch: Record<string, unknown> = {
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: fullName,
    phone: phone || null,
    ...coords,
  };
  if (email) patch.email = email;

  let { error } = await auth.service.from("profiles").update(patch).eq("id", userId);
  let usedMetadataFallback = false;

  if (error && /address_line|postal_code|funding_type|column|schema cache/i.test(error.message)) {
    // Colonnes B2C absentes en prod → stocker dans skills_metadata.btoc_coords
    const { data: current } = await auth.service
      .from("profiles")
      .select("skills_metadata")
      .eq("id", userId)
      .maybeSingle();
    const prevMeta =
      current?.skills_metadata && typeof current.skills_metadata === "object"
        ? (current.skills_metadata as Record<string, unknown>)
        : {};
    const fallback: Record<string, unknown> = {
      first_name: patch.first_name,
      last_name: patch.last_name,
      full_name: patch.full_name,
      phone: patch.phone,
      skills_metadata: { ...prevMeta, btoc_coords: coords },
      ...(email ? { email } : {}),
    };
    ({ error } = await auth.service.from("profiles").update(fallback).eq("id", userId));
    if (!error) usedMetadataFallback = true;
    else {
      // skills_metadata aussi absent → au moins nom / email / téléphone
      const bare = {
        first_name: patch.first_name,
        last_name: patch.last_name,
        full_name: patch.full_name,
        phone: patch.phone,
        ...(email ? { email } : {}),
      };
      ({ error } = await auth.service.from("profiles").update(bare).eq("id", userId));
      if (!error) {
        const client = await loadBtocClientFile(auth.service, userId, {
          canViewAdaptation: await canViewAdaptation(),
        });
        return NextResponse.json({
          warning:
            "Nom / téléphone enregistrés, mais adresse & financement non persistés (migration B2C manquante).",
          client,
        });
      }
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const client = await loadBtocClientFile(auth.service, userId, {
    canViewAdaptation: await canViewAdaptation(),
  });
  return NextResponse.json({
    client,
    ...(usedMetadataFallback
      ? { warning: "Coordonnées enregistrées (stockage de secours — appliquer la migration profiles B2C)." }
      : {}),
  });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaff();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: userId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  const { data: profile } = await auth.service
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, phone, is_test, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (action === "send_password_invite") {
    const to = String(profile.email ?? "").trim().toLowerCase();
    if (!to.includes("@")) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }
    const invite = await sendCrmUserPasswordInvite(auth.service, {
      email: to,
      firstName: String(profile.first_name ?? "").trim() || "bonjour",
      role: "PARTICULIER",
    });
    if (!invite.ok) {
      return NextResponse.json({ error: invite.error || "Envoi impossible" }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      message: `Demande de création de mot de passe envoyée à ${to}`,
    });
  }

  if (action === "relance_qualiopi") {
    const missing = Array.isArray(body.missing)
      ? body.missing.map((x) => String(x)).filter(Boolean)
      : [];
    const to = String(profile.email ?? "").trim().toLowerCase();
    if (!to.includes("@")) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }

    const name =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      String(profile.full_name ?? "bonjour");

    const html = buildEdgeEmailShell({
      title: "Relance documents formation",
      preheader: "Documents Qualiopi en attente",
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Bonjour ${escapeEdgeEmailHtml(name)},
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Il reste des étapes à compléter pour votre formation Byound
          ${missing.length ? ` : ${escapeEdgeEmailHtml(missing.join(", "))}` : ""}.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4A4A4A;">
          Connectez-vous à votre espace pour finaliser.
        </p>`,
      footerNote: "Relance journalisée depuis Byound Control (fiche Client BtoC)",
    });

    const result = await sendEmail({
      to,
      from: EDGE_COCKPIT_FROM,
      subject: "[Byound] Documents de formation en attente",
      html,
      tags: { type: "btoc-qualiopi-relance", user_id: userId },
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Envoi impossible" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: `Relance envoyée à ${to}` });
  }

  if (action === "assign_formation") {
    const trainingCourseId = String(body.training_course_id ?? "").trim();
    const reason = String(body.reason ?? "offerte").trim();
    if (!trainingCourseId) {
      return NextResponse.json({ error: "Formation requise" }, { status: 400 });
    }

    const { data: course } = await auth.service
      .from("training_courses")
      .select("id, title, lms_course_id, intra_price, inter_price")
      .eq("id", trainingCourseId)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    const lmsCourseId = (course as { lms_course_id?: string | null }).lms_course_id;
    if (lmsCourseId) {
      const { data: existingEnroll } = await auth.service
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", lmsCourseId)
        .maybeSingle();
      if (!existingEnroll) {
        await auth.service
          .from("enrollments")
          .insert({ user_id: userId, course_id: lmsCourseId, role: "learner" });
      }
    }

    // catalog_access si un item catalogue pointe vers ce content
    const { data: catalogItem } = await auth.service
      .from("catalog_items")
      .select("id")
      .eq("content_id", lmsCourseId ?? trainingCourseId)
      .maybeSingle();
    if (catalogItem?.id) {
      const { data: existingAccess } = await auth.service
        .from("catalog_access")
        .select("id")
        .eq("user_id", userId)
        .eq("catalog_item_id", catalogItem.id)
        .maybeSingle();
      if (!existingAccess) {
        await auth.service.from("catalog_access").insert({
          user_id: userId,
          catalog_item_id: catalogItem.id,
          access_status: "manually_granted",
          granted_at: new Date().toISOString(),
          organization_id: null,
        });
      }
    }

    // Dossier Qualiopi : org existante, sinon org personnelle BtoC pour coffre + positionnement
    let orgId: string | null = null;
    const { data: membership } = await auth.service
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (membership?.org_id) {
      orgId = String(membership.org_id);
    } else {
      const contactLabel =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        String(profile.full_name ?? profile.email ?? "Particulier");
      const slugBase = `btoc-${String(profile.email ?? userId)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)}`;
      const { data: org, error: orgErr } = await auth.service
        .from("organizations")
        .insert({
          name: `BtoC · ${contactLabel}`,
          slug: `${slugBase}-${Date.now().toString(36)}`,
        })
        .select("id")
        .single();
      if (!orgErr && org?.id) {
        orgId = String(org.id);
        await auth.service.from("org_memberships").upsert(
          { org_id: orgId, user_id: userId, role: "learner" },
          { onConflict: "org_id,user_id" },
        );
      }
    }

    let dossierId: string | null = null;
    let positionnementSent = 0;
    if (orgId) {
      const contactName =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        String(profile.full_name ?? "");
      let dossier;
      try {
        dossier = await createFormationDossier(auth.service, {
          organizationId: orgId,
          source: "manual",
          trainingCourseId,
          courseTitle: String(course.title ?? ""),
          contactName: contactName || null,
          contactEmail: String(profile.email ?? "") || null,
          contactPhone: (profile as { phone?: string | null }).phone ?? null,
          modalityPresence: "distanciel",
          notes: `Assignation BtoC (${reason})`,
          ownerUserId: auth.staffId,
          createdBy: auth.staffId,
        });
      } catch (e) {
        console.error("[btoc/assign] dossier:", e);
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Impossible de créer le dossier Qualiopi",
          },
          { status: 400 },
        );
      }
      dossierId = String(dossier.id);
      const { data: existingParticipant } = await auth.service
        .from("formation_participants")
        .select("id")
        .eq("dossier_id", dossierId)
        .eq("profile_id", userId)
        .maybeSingle();
      if (!existingParticipant) {
        // Pas de colonne `role` sur formation_participants (prod).
        const { error: participantError } = await auth.service
          .from("formation_participants")
          .insert({
            dossier_id: dossierId,
            profile_id: userId,
            bpf_learner_status: "particulier",
          });
        if (participantError) {
          console.error("[btoc/assign] participant:", participantError);
          return NextResponse.json(
            {
              error: `Dossier créé mais participant non rattaché : ${participantError.message}`,
              dossier_id: dossierId,
            },
            { status: 400 },
          );
        }
      }

      try {
        const pos = await sendAssessmentInvites(auth.service, {
          dossierId,
          kind: "positionnement",
          onlyPending: true,
        });
        positionnementSent = pos.sent;
        if (!positionnementSent && pos.errors?.length) {
          console.warn("[btoc/assign] positionnement errors:", pos.errors);
        }
      } catch (e) {
        console.warn("[btoc/assign] positionnement:", e);
      }
    }

    const client = await loadBtocClientFile(auth.service, userId, {
      canViewAdaptation: await canViewAdaptation(),
    });
    return NextResponse.json({
      ok: true,
      dossier_id: dossierId,
      positionnement_sent: positionnementSent,
      warning: dossierId
        ? positionnementSent
          ? null
          : "Formation assignée — positionnement non envoyé (vérifier l’e-mail / le template)."
        : "Inscription créée sans dossier Qualiopi.",
      client,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
