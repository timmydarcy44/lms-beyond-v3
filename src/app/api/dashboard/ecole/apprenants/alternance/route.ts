import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const ALLOWED_PLACEMENT = new Set([
  "recherche_alternance",
  "en_alternance",
  "en_stage",
  "contrat_fip",
  "initial",
]);

type Body = {
  learnerId?: string;
  host_company_prospect_id?: string | null;
  enterprise_tutor_name?: string | null;
  enterprise_tutor_email?: string | null;
  new_company?: { company_name: string; siret?: string | null };
  placement_status?: string | null;
  /** Règle métier : `initial` = parcours sans entreprise ; `auto` = recherche / alternance selon l'entreprise. */
  placement_mode?: "initial" | "auto";
  date_of_birth?: string | null;
  has_driving_license_b?: boolean | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  school_class?: string | null;
  email?: string | null;
};

function looseEmailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return NextResponse.json({ error: "École non identifiée" }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const learnerId = String(body.learnerId ?? "").trim();
  if (!isUuid(learnerId)) {
    return NextResponse.json({ error: "learnerId invalide" }, { status: 400 });
  }

  let writeClient = supabase;
  try {
    writeClient = await getServiceSupabase();
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error:
            "Configuration serveur incomplète : ajoutez SUPABASE_SERVICE_ROLE_KEY pour permettre la mise à jour des fiches apprenants par l’équipe école.",
        },
        { status: 503 },
      );
    }
    throw e;
  }

  const { data: pivot } = await writeClient
    .from("school_students")
    .select("student_id")
    .eq("school_id", schoolId)
    .eq("student_id", learnerId)
    .maybeSingle();

  const { data: prof } = await writeClient.from("profiles").select("id, school_id").eq("id", learnerId).maybeSingle();

  const sameSchool = prof?.school_id != null && String(prof.school_id) === schoolId;
  if (!pivot?.student_id && !sameSchool) {
    return NextResponse.json({ error: "Apprenant non rattaché à votre établissement" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const hasCompanyBlock =
    Object.prototype.hasOwnProperty.call(body, "host_company_prospect_id") ||
    Object.prototype.hasOwnProperty.call(body, "new_company") ||
    Object.prototype.hasOwnProperty.call(body, "enterprise_tutor_name") ||
    Object.prototype.hasOwnProperty.call(body, "enterprise_tutor_email");

  let hostIdForResponse: string | null | undefined;

  if (hasCompanyBlock) {
    const explicitHost = Object.prototype.hasOwnProperty.call(body, "host_company_prospect_id");
    let hostId: string | null = explicitHost
      ? body.host_company_prospect_id != null && String(body.host_company_prospect_id).trim()
        ? String(body.host_company_prospect_id).trim()
        : null
      : null;

    if (!explicitHost && !body.new_company?.company_name?.trim()) {
      const { data: curHost } = await writeClient
        .from("profiles")
        .select("host_company_prospect_id")
        .eq("id", learnerId)
        .maybeSingle();
      hostId =
        curHost?.host_company_prospect_id != null && String(curHost.host_company_prospect_id).trim()
          ? String(curHost.host_company_prospect_id).trim()
          : null;
    }

    if (body.new_company?.company_name?.trim()) {
      const name = body.new_company.company_name.trim();
      const siret = body.new_company.siret?.trim() || null;
      const insertRow: Record<string, unknown> = {
        school_id: schoolId,
        name,
        company_name: name,
        company_status: "prospect",
        step: "Prospect",
      };
      if (siret) insertRow.siret = siret;
      const { data: created, error: insErr } = await writeClient
        .from("crm_prospects")
        .insert(insertRow)
        .select("id")
        .single();
      if (insErr || !created?.id) {
        return NextResponse.json({ error: insErr?.message || "Création entreprise impossible" }, { status: 400 });
      }
      hostId = String(created.id);
    }

    if (hostId != null && String(hostId).trim() !== "") {
      const hid = String(hostId).trim();
      if (!isUuid(hid)) {
        return NextResponse.json({ error: "host_company_prospect_id invalide" }, { status: 400 });
      }
      const { data: prospectOk } = await writeClient
        .from("crm_prospects")
        .select("id")
        .eq("id", hid)
        .eq("school_id", schoolId)
        .maybeSingle();
      if (!prospectOk?.id) {
        return NextResponse.json(
          { error: "Entreprise introuvable ou hors de votre établissement." },
          { status: 400 },
        );
      }
      hostId = hid;
    }

    patch.host_company_prospect_id = hostId;
    if (Object.prototype.hasOwnProperty.call(body, "enterprise_tutor_name")) {
      patch.enterprise_tutor_name =
        body.enterprise_tutor_name != null ? String(body.enterprise_tutor_name).trim() || null : null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "enterprise_tutor_email")) {
      patch.enterprise_tutor_email =
        body.enterprise_tutor_email != null ? String(body.enterprise_tutor_email).trim() || null : null;
    }
    hostIdForResponse = hostId;

    if (hostId != null && String(hostId).trim() !== "") {
      patch.placement_status = "en_alternance";
    } else {
      const { data: curPlacementRow } = await writeClient
        .from("profiles")
        .select("placement_status")
        .eq("id", learnerId)
        .maybeSingle();
      const ps = curPlacementRow?.placement_status;
      if (ps === "initial") {
        patch.placement_status = "initial";
      } else if (ps === "en_stage" || ps === "contrat_fip") {
        patch.placement_status = ps;
      } else {
        patch.placement_status = "recherche_alternance";
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "placement_status")) {
    const raw = body.placement_status;
    if (raw == null || String(raw).trim() === "") {
      patch.placement_status = null;
    } else {
      const v = String(raw).trim();
      if (!ALLOWED_PLACEMENT.has(v)) {
        return NextResponse.json({ error: "placement_status invalide" }, { status: 400 });
      }
      patch.placement_status = v;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "placement_mode")) {
    const mode = String(body.placement_mode ?? "").trim();
    if (mode !== "initial" && mode !== "auto") {
      return NextResponse.json({ error: "placement_mode invalide (initial | auto)" }, { status: 400 });
    }
    const { data: hostRow } = await writeClient
      .from("profiles")
      .select("host_company_prospect_id")
      .eq("id", learnerId)
      .maybeSingle();
    const hostFromPatch =
      patch.host_company_prospect_id !== undefined
        ? (patch.host_company_prospect_id as string | null)
        : hostRow?.host_company_prospect_id;
    const hasHost = hostFromPatch != null && String(hostFromPatch).trim() !== "";

    if (mode === "initial") {
      if (hasHost) {
        return NextResponse.json(
          { error: "Retirez l'entreprise d'accueil pour passer en parcours Initial." },
          { status: 400 },
        );
      }
      patch.placement_status = "initial";
    } else {
      patch.placement_status = hasHost ? "en_alternance" : "recherche_alternance";
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "date_of_birth")) {
    const raw = body.date_of_birth;
    if (raw == null || String(raw).trim() === "") {
      patch.date_of_birth = null;
    } else {
      const d = String(raw).trim().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json({ error: "date_of_birth invalide (AAAA-MM-JJ)" }, { status: 400 });
      }
      patch.date_of_birth = d;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "has_driving_license_b")) {
    const v = body.has_driving_license_b;
    patch.has_driving_license_b = v === null || v === undefined ? null : Boolean(v);
  }

  for (const key of ["first_name", "last_name", "school_class"] as const) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const raw = body[key];
      patch[key] = raw == null ? null : String(raw).trim() || null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const raw = body.phone;
    const v = raw == null ? "" : String(raw).trim();
    const tel = v || null;
    patch.phone = tel;
    patch.telephone = tel;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const em = body.email == null ? "" : String(body.email).trim();
    if (!em) {
      /* Ne pas mettre email à NULL (souvent NOT NULL + compte auth). */
    } else if (!looseEmailOk(em)) {
      return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
    } else {
      patch.email = em;
    }
  }

  const keys = Object.keys(patch).filter((k) => k !== "updated_at");
  if (keys.length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const { error: upErr } = await writeClient.from("profiles").update(patch).eq("id", learnerId);

  if (upErr) {
    console.error("[alternance]", upErr.message);
    const msg = upErr.message || "";
    const rls = /row-level security|RLS|permission denied/i.test(msg);
    return NextResponse.json(
      {
        error: rls
          ? "Mise à jour refusée (droits base de données). Vérifiez la clé service Supabase côté serveur."
          : msg,
      },
      { status: rls ? 403 : 400 },
    );
  }

  return NextResponse.json({
    success: true,
    ...(hostIdForResponse !== undefined ? { host_company_prospect_id: hostIdForResponse } : {}),
  });
}
