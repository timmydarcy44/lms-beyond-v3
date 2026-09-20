import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isAllowedAbsenceProof } from "@/lib/ecole/absences";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;

  const { data, error } = await db
    .from("school_absences")
    .select(
      `
      id, status, kind, duration_hours, motif, proof_filename, created_at, updated_at,
      slot:school_planning_slots(
        id, starts_at, ends_at, duration_hours,
        module:school_planning_modules(id, name),
        instructor:school_instructors(id, first_name, last_name)
      )
    `,
    )
    .eq("learner_id", session.id)
    .order("created_at", { ascending: false });

  if (error) {
    const simple = await db
      .from("school_absences")
      .select("*")
      .eq("learner_id", session.id)
      .order("created_at", { ascending: false });
    return NextResponse.json({ absences: simple.data ?? [], warning: error.message });
  }

  return NextResponse.json({ absences: data ?? [] });
}

/** Envoi justificatif (ne justifie pas automatiquement). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const form = await req.formData();
  const absenceId = String(form.get("absence_id") ?? "").trim();
  const motif = String(form.get("motif") ?? "").trim();
  const file = form.get("file");

  if (!absenceId) return NextResponse.json({ error: "ABSENCE_REQUIRED" }, { status: 400 });

  const { data: absence } = await db
    .from("school_absences")
    .select("*")
    .eq("id", absenceId)
    .eq("learner_id", session.id)
    .maybeSingle();
  if (!absence) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let proofPath: string | null = absence.proof_path ?? null;
  let proofFilename: string | null = absence.proof_filename ?? null;
  let proofMime: string | null = absence.proof_mime ?? null;
  let proofSize: number | null = absence.proof_size ?? null;

  if (file && typeof file !== "string" && "arrayBuffer" in file) {
    const f = file as File;
    const mime = f.type || "application/octet-stream";
    if (!isAllowedAbsenceProof(mime, f.name)) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const safeName = f.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const path = `school-absences/${absence.school_id}/${session.id}/${absenceId}-${Date.now()}-${safeName}`;
    const buckets = ["Public", "public"];
    let uploaded = false;
    for (const bucket of buckets) {
      const { error: upErr } = await db.storage.from(bucket).upload(path, buffer, {
        contentType: mime,
        upsert: true,
      });
      if (!upErr) {
        uploaded = true;
        proofPath = `${bucket}:${path}`;
        proofFilename = f.name;
        proofMime = mime;
        proofSize = buffer.length;
        break;
      }
    }
    if (!uploaded) {
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
    }
  } else if (!proofPath) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  const prevStatus = absence.status;
  const { data, error } = await db
    .from("school_absences")
    .update({
      motif: motif || absence.motif,
      proof_path: proofPath,
      proof_filename: proofFilename,
      proof_mime: proofMime,
      proof_size: proofSize,
      status: "proof_sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", absenceId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await db.from("school_absence_status_history").insert({
    absence_id: absenceId,
    from_status: prevStatus,
    to_status: "proof_sent",
    changed_by: session.id,
    note: motif || "Justificatif envoyé",
  });

  return NextResponse.json({ absence: data });
}
