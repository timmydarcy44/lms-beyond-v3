import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isHandicapPortfolioOnlyRoleType } from "@/lib/auth/school-role-type-guards";
import { loadBtocClientFile } from "@/lib/control/btoc-client-file";
import { createFormationDossier } from "@/lib/formation-dossier/create-dossier";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ userId: string }> };

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

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaff();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId } = await ctx.params;
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

  const patch: Record<string, unknown> = {
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: fullName,
    phone: phone || null,
    address_line: String(body.address_line ?? "").trim() || null,
    postal_code: postal || null,
    city: String(body.city ?? "").trim() || null,
    funding_type: fundingType,
  };
  if (email) patch.email = email;

  let { error } = await auth.service.from("profiles").update(patch).eq("id", userId);
  if (error && /address_line|postal_code|funding_type|column|schema cache/i.test(error.message)) {
    const fallback = {
      first_name: patch.first_name,
      last_name: patch.last_name,
      full_name: patch.full_name,
      phone: patch.phone,
      ...(email ? { email } : {}),
    };
    ({ error } = await auth.service.from("profiles").update(fallback).eq("id", userId));
    if (!error) {
      // Colonnes adresse absentes : avertir
      const client = await loadBtocClientFile(auth.service, userId, {
        canViewAdaptation: await canViewAdaptation(),
      });
      return NextResponse.json({
        warning: "Adresse / financement non persistés — appliquer la migration profiles B2C.",
        client,
      });
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const client = await loadBtocClientFile(auth.service, userId, {
    canViewAdaptation: await canViewAdaptation(),
  });
  return NextResponse.json({ client });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaff();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  const { data: profile } = await auth.service
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, phone, is_test, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const isTest = (profile as { is_test?: boolean }).is_test === true;
  if (!isTest) {
    return NextResponse.json(
      { error: "Action réservée aux comptes de test (is_test = true)." },
      { status: 400 },
    );
  }

  if (action === "relance_qualiopi") {
    const missing = Array.isArray(body.missing)
      ? body.missing.map((x) => String(x)).filter(Boolean)
      : [];
    const to = String(profile.email ?? "").trim().toLowerCase();
    if (!to.includes("@")) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }
    // Garde-fou : uniquement adresses de test pendant les essais
    if (!/(\+test|@byound\.|@exemple\.|@example\.|@test\.)/i.test(to) && !isTest) {
      return NextResponse.json({ error: "Relance bloquée hors adresse de test" }, { status: 400 });
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

    // Dossier Qualiopi si le particulier a une org (sinon enrollment seul)
    const { data: membership } = await auth.service
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let dossierId: string | null = null;
    if (membership?.org_id) {
      const contactName =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        String(profile.full_name ?? "");
      const dossier = await createFormationDossier(auth.service, {
        organizationId: String(membership.org_id),
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
      dossierId = String(dossier.id);
      const { data: existingParticipant } = await auth.service
        .from("formation_participants")
        .select("id")
        .eq("dossier_id", dossierId)
        .eq("profile_id", userId)
        .maybeSingle();
      if (!existingParticipant) {
        await auth.service.from("formation_participants").insert({
          dossier_id: dossierId,
          profile_id: userId,
          role: "learner",
        });
      }
    }

    const client = await loadBtocClientFile(auth.service, userId, {
      canViewAdaptation: await canViewAdaptation(),
    });
    return NextResponse.json({
      ok: true,
      dossier_id: dossierId,
      warning: dossierId
        ? null
        : "Inscription créée. Reliez le particulier à une organisation pour ouvrir le coffre Qualiopi.",
      client,
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
