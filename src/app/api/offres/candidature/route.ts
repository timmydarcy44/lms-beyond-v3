import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadHomeApplication } from "@/lib/offres/application-home";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET() {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return NextResponse.json({ remaining: 0 });
  const application = await loadHomeApplication(db, session.id);
  if (!application || application.status !== "draft" || application.closed) return NextResponse.json({ remaining: 0 });
  const tests = [application.tests.soft, application.tests.disc, application.tests.idmc].filter(Boolean).length;
  const done = (application.profileDone ? 1 : 0) + (tests === 3 ? 1 : 0);
  return NextResponse.json({ remaining: Math.max(0, 3 - done) });
}

export async function POST(request: Request) {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const phone = String(form.get("phone") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const pitch = String(form.get("pitch") ?? "").trim().slice(0, 280);
  const file = form.get("cv");
  if (phone.replace(/\D/g, "").length < 8) return NextResponse.json({ error: "Indiquez un numéro de téléphone." }, { status: 400 });
  if (city.length < 2) return NextResponse.json({ error: "Indiquez votre ville." }, { status: 400 });

  const owned = await db.from("applications").select("id, status, cv_path").eq("id", id).eq("talent_id", session.id).maybeSingle();
  const row = owned.data as { status?: string | null; cv_path?: string | null } | null;
  if (!row || row.status !== "draft") return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });

  let cvPath = String(row.cv_path ?? "");
  if (file instanceof File && file.size > 0) {
    if (!TYPES.has(file.type) && !/\.(pdf|docx?)$/i.test(file.name)) {
      return NextResponse.json({ error: "Le CV doit être un PDF ou un document Word." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Le CV dépasse 5 Mo." }, { status: 400 });
    const uploaded = await storeCv(db, session.id, file);
    if (!uploaded) return NextResponse.json({ error: "Le CV n'a pas pu être déposé." }, { status: 400 });
    cvPath = uploaded;
    await db.from("profiles").update({ cv_url: uploaded, cv_file_name: file.name.slice(0, 180) }).eq("id", session.id);
  }
  await db.from("profiles").update({ phone, city }).eq("id", session.id);
  const saved = await db.from("applications").update({ phone, city, pitch, ...(cvPath ? { cv_path: cvPath } : {}) }).eq("id", id);
  if (saved.error && !/column|schema cache/i.test(saved.error.message)) {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

async function storeCv(db: NonNullable<ReturnType<typeof getServiceRoleClient>>, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${userId}/cv/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  for (const bucket of ["Beyond Connect", "beyond-connect", "Public", "public", "uploads"]) {
    const uploaded = await db.storage.from(bucket).upload(path, buffer, { upsert: true, contentType: file.type || "application/pdf" });
    if (!uploaded.error) return `${bucket}/${path}`;
  }
  return null;
}
