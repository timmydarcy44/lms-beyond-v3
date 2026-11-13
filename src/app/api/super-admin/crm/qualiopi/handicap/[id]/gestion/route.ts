import { NextRequest, NextResponse } from "next/server";
import { requireHandicapReferentAccess } from "@/lib/handicap/access";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadBundle(service: NonNullable<ReturnType<typeof getServiceRoleClient>>, profileId: string) {
  const { data: profile, error } = await service
    .from("handicap_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) return { error: error.message, status: 400 as const };
  if (!profile) return { error: "Profil introuvable", status: 404 as const };

  const docsRes = await service
    .from("handicap_documents")
    .select("id, kind, title, file_url, file_name, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  const meetingsRes = await service
    .from("handicap_meetings")
    .select("id, sequence_n, status, notes, held_at, closed_at, created_at, updated_at")
    .eq("profile_id", profileId)
    .order("sequence_n", { ascending: true });

  const schemaMissing =
    (docsRes.error && /schema cache|does not exist|Could not find the table/i.test(docsRes.error.message)) ||
    (meetingsRes.error && /schema cache|does not exist|Could not find the table/i.test(meetingsRes.error.message));

  if (schemaMissing) {
    return {
      error:
        "Migration gestion handicap manquante — appliquez supabase/migrations/20261113200000_handicap_gestion.sql",
      status: 503 as const,
    };
  }
  if (docsRes.error) return { error: docsRes.error.message, status: 400 as const };
  if (meetingsRes.error) return { error: meetingsRes.error.message, status: 400 as const };

  let organization_name: string | null = null;
  if (profile.organization_id) {
    const { data: org } = await service
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    organization_name = org?.name ? String(org.name) : null;
  }

  const list = meetingsRes.data ?? [];
  if (list.length === 0) {
    // Ensure RDV 1 exists for the workflow
    const { data: first } = await service
      .from("handicap_meetings")
      .insert({
        profile_id: profileId,
        sequence_n: 1,
        status: "open",
      })
      .select("id, sequence_n, status, notes, held_at, closed_at, created_at, updated_at")
      .maybeSingle();
    if (first) list.push(first);
  }

  return {
    profile: { ...profile, organization_name },
    documents: docsRes.data ?? [],
    meetings: list,
  };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireHandicapReferentAccess();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const bundle = await loadBundle(service, id);
  if ("error" in bundle && bundle.error) {
    return NextResponse.json({ error: bundle.error }, { status: bundle.status });
  }
  return NextResponse.json(bundle);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireHandicapReferentAccess();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: profileId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const action = String(body.action ?? "").trim();

  if (action === "save_fields") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ("specific_needs" in body) {
      patch.specific_needs = String(body.specific_needs ?? "").trim() || null;
    }
    if ("accompaniment_plan" in body) {
      patch.accompaniment_plan = String(body.accompaniment_plan ?? "").trim() || null;
    }
    if ("needs_summary" in body) {
      patch.needs_summary = String(body.needs_summary ?? "").trim() || null;
    }
    if ("referent_notes" in body) {
      patch.referent_notes = String(body.referent_notes ?? "").trim() || null;
    }
    const { error } = await service.from("handicap_profiles").update(patch).eq("id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const bundle = await loadBundle(service, profileId);
    return NextResponse.json(bundle);
  }

  if (action === "save_meeting") {
    const meetingId = String(body.meeting_id ?? "").trim();
    if (!meetingId) return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });
    const notes = String(body.notes ?? "").trim() || null;
    const heldAt = body.held_at != null ? String(body.held_at).trim() || null : undefined;
    const patch: Record<string, unknown> = {
      notes,
      updated_at: new Date().toISOString(),
    };
    if (heldAt !== undefined) patch.held_at = heldAt;
    const { error } = await service
      .from("handicap_meetings")
      .update(patch)
      .eq("id", meetingId)
      .eq("profile_id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const bundle = await loadBundle(service, profileId);
    return NextResponse.json(bundle);
  }

  if (action === "close_meeting") {
    const meetingId = String(body.meeting_id ?? "").trim();
    if (!meetingId) return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });

    const { data: meeting } = await service
      .from("handicap_meetings")
      .select("id, sequence_n, status, notes")
      .eq("id", meetingId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!meeting) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    if (meeting.status === "closed") {
      return NextResponse.json({ error: "Rendez-vous déjà clos" }, { status: 409 });
    }
    if (!String(meeting.notes ?? "").trim()) {
      return NextResponse.json(
        { error: "Ajoutez les notes du rendez-vous avant de le clôturer." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { error } = await service
      .from("handicap_meetings")
      .update({ status: "closed", closed_at: now, updated_at: now })
      .eq("id", meetingId)
      .eq("profile_id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const nextSeq = Number(meeting.sequence_n) + 1;
    await service.from("handicap_meetings").upsert(
      {
        profile_id: profileId,
        sequence_n: nextSeq,
        status: "open",
      },
      { onConflict: "profile_id,sequence_n", ignoreDuplicates: true },
    );

    await service
      .from("handicap_profiles")
      .update({ updated_at: now })
      .eq("id", profileId);

    const bundle = await loadBundle(service, profileId);
    return NextResponse.json(bundle);
  }

  if (action === "delete_document") {
    const docId = String(body.document_id ?? "").trim();
    if (!docId) return NextResponse.json({ error: "document_id requis" }, { status: 400 });
    const { error } = await service
      .from("handicap_documents")
      .delete()
      .eq("id", docId)
      .eq("profile_id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const bundle = await loadBundle(service, profileId);
    return NextResponse.json(bundle);
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireHandicapReferentAccess();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: profileId } = await ctx.params;
  const { data: profile } = await service.from("handicap_profiles").select("id").eq("id", profileId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const file = form.get("file");

  if (kind !== "rqth" && kind !== "autre") {
    return NextResponse.json({ error: "kind invalide (rqth|autre)" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `handicap/${profileId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await service.storage.from("public").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 });

  const { data: pub } = service.storage.from("public").getPublicUrl(path);
  const { data: doc, error } = await service
    .from("handicap_documents")
    .insert({
      profile_id: profileId,
      kind,
      title,
      file_url: pub.publicUrl,
      file_name: file.name,
      uploaded_by: gate.userId,
    })
    .select("id, kind, title, file_url, file_name, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await service
    .from("handicap_profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", profileId);

  return NextResponse.json({ document: doc }, { status: 201 });
}
