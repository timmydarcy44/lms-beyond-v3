import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  BPF_FUNDER_TYPES,
  type BpfFunderType,
} from "@/lib/formation-dossier/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { data, error } = await service
    .from("formation_dossiers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const [{ data: documents }, { data: assignments }, { data: events }] = await Promise.all([
    service.from("formation_documents").select("*").eq("dossier_id", id).order("kind"),
    service.from("formation_assignments").select("*").eq("dossier_id", id),
    service
      .from("formation_events")
      .select("*")
      .eq("dossier_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    dossier: {
      ...data,
      formation_documents: documents ?? [],
      formation_assignments: assignments ?? [],
      formation_events: events ?? [],
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const { data: current } = await service
    .from("formation_dossiers")
    .select("id, subcontracting, bpf_funder_type, pending_confirm_fields")
    .eq("id", id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const stringFields = [
    "course_title",
    "contact_name",
    "contact_email",
    "contact_phone",
    "notes",
    "partner_of_name",
    "partner_of_siret",
    "training_course_id",
    "session_id",
    "owner_user_id",
    "opco_name",
  ] as const;

  for (const key of stringFields) {
    if (body[key] !== undefined) {
      patch[key] = body[key] === null || body[key] === "" ? null : String(body[key]);
    }
  }

  if (body.modality_intra_inter !== undefined) {
    patch.modality_intra_inter =
      body.modality_intra_inter === "intra" || body.modality_intra_inter === "inter"
        ? body.modality_intra_inter
        : null;
  }
  if (body.modality_presence !== undefined) {
    patch.modality_presence =
      body.modality_presence === "presentiel" ||
      body.modality_presence === "distanciel" ||
      body.modality_presence === "hybride"
        ? body.modality_presence
        : null;
  }
  if (body.funding_type !== undefined) {
    patch.funding_type =
      body.funding_type === "direct" ||
      body.funding_type === "opco" ||
      body.funding_type === "subrogation"
        ? body.funding_type
        : null;
  }
  if (body.subcontracting !== undefined) {
    const sub =
      body.subcontracting === "aucune" ||
      body.subcontracting === "recue" ||
      body.subcontracting === "confiee"
        ? body.subcontracting
        : "aucune";
    patch.subcontracting = sub;
    if (sub === "recue") {
      patch.bpf_funder_type = "autres_of";
    }
  }
  if (body.bpf_funder_type !== undefined) {
    const nextSub =
      typeof patch.subcontracting === "string"
        ? patch.subcontracting
        : current.subcontracting;
    if (nextSub === "recue") {
      patch.bpf_funder_type = "autres_of";
    } else if (
      body.bpf_funder_type === null ||
      body.bpf_funder_type === "" ||
      BPF_FUNDER_TYPES.includes(String(body.bpf_funder_type) as BpfFunderType)
    ) {
      patch.bpf_funder_type =
        body.bpf_funder_type === null || body.bpf_funder_type === ""
          ? null
          : String(body.bpf_funder_type);
    }
  }

  for (const key of ["amount_ht_cents", "amount_tva_cents", "amount_ttc_cents", "partner_of_amount_ht_cents"] as const) {
    if (body[key] !== undefined) {
      patch[key] = body[key] == null ? null : Math.round(Number(body[key]));
    }
  }

  if (body.identity_check_first_attendance !== undefined) {
    patch.identity_check_first_attendance = Boolean(body.identity_check_first_attendance);
  }

  if (Array.isArray(body.pending_confirm_fields)) {
    patch.pending_confirm_fields = body.pending_confirm_fields.map(String);
  } else if (body.confirm_fields === true) {
    patch.pending_confirm_fields = [];
  }

  let { data, error } = await service
    .from("formation_dossiers")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error && /opco_name/i.test(error.message) && "opco_name" in patch) {
    delete patch.opco_name;
    ({ data, error } = await service
      .from("formation_dossiers")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  await service.from("formation_events").insert({
    dossier_id: id,
    event_type: "updated",
    actor_user_id: actorUserId,
    payload: { patch: Object.keys(patch) },
  });

  return NextResponse.json({ dossier: data });
}
