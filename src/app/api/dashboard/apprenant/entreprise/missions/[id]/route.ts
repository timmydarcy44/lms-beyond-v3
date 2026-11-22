import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadWithBucketFallback } from "@/lib/storage/ensure-bucket";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { notifyTutorMissionSubmitted } from "@/lib/tuteur/mission-emails";
import {
  hasValidProofText,
  normalizeMissionStatus,
} from "@/lib/tuteur/mission-status";

export const dynamic = "force-dynamic";

const PROOF_BUCKET = "tutor-mission-proofs";
const MAX_FILE = 20 * 1024 * 1024;

async function uploadMissionProof(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  path: string,
  buffer: Buffer,
  contentType: string,
) {
  return uploadWithBucketFallback(db, {
    preferredBucket: PROOF_BUCKET,
    path,
    buffer,
    contentType,
    preferredPublic: false,
    fallbacks: [
      { bucket: "cfa-applications", pathPrefix: "tutor-mission-proofs", public: false },
      { bucket: "public", pathPrefix: "tutor-missions", public: true },
    ],
  });
}

function storePathRef(uploaded: { bucket: string; path: string; public: boolean }) {
  if (uploaded.bucket === PROOF_BUCKET) return uploaded.path;
  if (uploaded.public) return `public:${uploaded.path}`;
  return `${uploaded.bucket}:${uploaded.path}`;
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

type ProofFile = { path: string; name: string; size: number; mime: string };
type ProofLink = { url: string; label?: string };

async function loadOwnedMission(db: NonNullable<ReturnType<typeof getServiceRoleClient>>, missionId: string, userId: string) {
  const { data: mission } = await db
    .from("tutor_missions")
    .select(
      "id, assignment_id, status, title, learner_note, proof_url, proof_links, proof_files, tutor_opened_at, submitted_at, skill_id",
    )
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) return null;
  const { data: assignment } = await db
    .from("tutor_assignments")
    .select("id, learner_id, tutor_id, status")
    .eq("id", (mission as { assignment_id: string }).assignment_id)
    .maybeSingle();
  if (
    !assignment ||
    String((assignment as { learner_id: string }).learner_id) !== userId ||
    !["active", "paused"].includes(String((assignment as { status?: string }).status ?? ""))
  ) {
    return null;
  }
  return { mission, assignment };
}

/** L'alternant démarre, sauvegarde un brouillon, soumet, retire ou complète une preuve. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { id: missionId } = await params;
  const owned = await loadOwnedMission(db, missionId, session.id);
  if (!owned) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";
  let action = "";
  let learnerNote = "";
  let proofLinks: ProofLink[] = [];
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    action = String(form.get("action") ?? "");
    learnerNote = String(form.get("learnerNote") ?? "").trim();
    const linksRaw = String(form.get("proofLinks") ?? "[]");
    try {
      const parsed = JSON.parse(linksRaw) as unknown;
      if (Array.isArray(parsed)) {
        proofLinks = parsed
          .map((row) => {
            const r = row as { url?: string; label?: string };
            const url = String(r.url ?? "").trim();
            if (!url) return null;
            return { url, label: r.label ? String(r.label) : undefined };
          })
          .filter((x): x is ProofLink => Boolean(x));
      }
    } catch {
      proofLinks = [];
    }
    const raw = form.get("file");
    file = raw instanceof File && raw.size > 0 ? raw : null;
  } else {
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      learnerNote?: string;
      proofLinks?: ProofLink[];
      proofUrl?: string;
    } | null;
    action = String(body?.action ?? "");
    learnerNote = String(body?.learnerNote ?? "").trim();
    if (Array.isArray(body?.proofLinks)) {
      proofLinks = body!.proofLinks!
        .map((r) => {
          const url = String(r?.url ?? "").trim();
          if (!url) return null;
          return { url, label: r.label ? String(r.label) : undefined };
        })
        .filter((x): x is ProofLink => Boolean(x));
    } else if (body?.proofUrl) {
      proofLinks = [{ url: String(body.proofUrl).trim() }];
    }
  }

  const current = normalizeMissionStatus(String((owned.mission as { status?: string }).status));
  const existingFiles = Array.isArray((owned.mission as { proof_files?: ProofFile[] }).proof_files)
    ? ((owned.mission as { proof_files: ProofFile[] }).proof_files ?? [])
    : [];
  const existingLinks = Array.isArray((owned.mission as { proof_links?: ProofLink[] }).proof_links)
    ? ((owned.mission as { proof_links: ProofLink[] }).proof_links ?? [])
    : [];
  const legacyUrl = String((owned.mission as { proof_url?: string | null }).proof_url ?? "").trim();

  if (action === "save_draft") {
    if (!["assigned", "changes_requested"].includes(current)) {
      return NextResponse.json({ error: "Brouillon impossible sur cette mission." }, { status: 400 });
    }
    let files = existingFiles;
    if (file) {
      if (file.size > MAX_FILE) {
        return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 400 });
      }
      const safe = sanitizeFileName(file.name || "preuve");
      const path = `${session.id}/${missionId}/${Date.now()}-${safe}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadMissionProof(
        db,
        path,
        buffer,
        file.type || "application/octet-stream",
      );
      if ("error" in uploaded) {
        return NextResponse.json({ error: `Upload impossible : ${uploaded.error}` }, { status: 400 });
      }
      files = [
        ...existingFiles,
        {
          path: storePathRef(uploaded),
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
        },
      ];
    }
    const links = proofLinks.length ? proofLinks : existingLinks;
    const patch: Record<string, unknown> = {
      learner_note: learnerNote || null,
      proof_links: links,
      proof_files: files,
      status: current === "changes_requested" ? "changes_requested" : "assigned",
    };
    if (links[0]?.url) patch.proof_url = links[0].url;
    const { error } = await db.from("tutor_missions").update(patch).eq("id", missionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: patch.status, proofFiles: files, proofLinks: links });
  }

  if (action === "submit") {
    if (!["assigned", "changes_requested"].includes(current)) {
      return NextResponse.json({ error: "Cette mission n’est plus à envoyer." }, { status: 400 });
    }
    const note =
      learnerNote ||
      String((owned.mission as { learner_note?: string | null }).learner_note ?? "").trim();
    if (!hasValidProofText(note)) {
      return NextResponse.json(
        {
          error: `Écris au moins 20 caractères pour décrire ton travail (actuellement ${note.length}).`,
        },
        { status: 400 },
      );
    }
    let files = existingFiles;
    if (file) {
      if (file.size > MAX_FILE) {
        return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 400 });
      }
      const safe = sanitizeFileName(file.name || "preuve");
      const path = `${session.id}/${missionId}/${Date.now()}-${safe}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadMissionProof(
        db,
        path,
        buffer,
        file.type || "application/octet-stream",
      );
      if ("error" in uploaded) {
        return NextResponse.json({ error: `Upload impossible : ${uploaded.error}` }, { status: 400 });
      }
      files = [
        ...existingFiles,
        {
          path: storePathRef(uploaded),
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
        },
      ];
    }
    const links = proofLinks.length
      ? proofLinks
      : existingLinks.length
        ? existingLinks
        : legacyUrl
          ? [{ url: legacyUrl }]
          : [];

    const payload: Record<string, unknown> = {
      status: "submitted",
      submitted_at: new Date().toISOString(),
      learner_note: note,
      proof_links: links,
      proof_files: files,
      tutor_opened_at: null,
      proof_url: links[0]?.url || null,
    };
    const { error } = await db.from("tutor_missions").update(payload).eq("id", missionId);
    if (error) {
      // Fallback si colonnes/statut v3 absents
      if (/status|proof_links|proof_files|column|check/i.test(error.message)) {
        const fallback = await db
          .from("tutor_missions")
          .update({
            status: "submitted",
            submitted_at: new Date().toISOString(),
            learner_note: note,
            proof_url: links[0]?.url || null,
          })
          .eq("id", missionId);
        if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 400 });
      } else {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const tutorId = String((owned.assignment as { tutor_id?: string | null }).tutor_id ?? "");
    if (tutorId) {
      const { data: learnerProfile } = await db
        .from("profiles")
        .select("full_name, first_name, last_name, email")
        .eq("id", session.id)
        .maybeSingle();
      const learnerName =
        String((learnerProfile as { full_name?: string | null } | null)?.full_name ?? "").trim() ||
        [
          (learnerProfile as { first_name?: string | null } | null)?.first_name,
          (learnerProfile as { last_name?: string | null } | null)?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Alternant";
      void notifyTutorMissionSubmitted({
        db,
        tutorId,
        learnerName,
        missionTitle: String((owned.mission as { title?: string }).title ?? "Mission"),
        learnerNote: note,
        proofUrl: links[0]?.url || null,
      }).catch((err) => console.warn("[apprenant/missions] mail tutor", err));
    }

    return NextResponse.json({ ok: true, status: "submitted" });
  }

  if (action === "withdraw") {
    if (current !== "submitted") {
      return NextResponse.json({ error: "Rien à retirer." }, { status: 400 });
    }
    if ((owned.mission as { tutor_opened_at?: string | null }).tutor_opened_at) {
      return NextResponse.json(
        { error: "Ton tuteur a déjà ouvert la preuve — tu ne peux plus retirer l’envoi." },
        { status: 400 },
      );
    }
    const { error } = await db
      .from("tutor_missions")
      .update({
        status: "assigned",
        submitted_at: null,
      })
      .eq("id", missionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: "assigned" });
  }

  if (action === "remove_file") {
    const body = contentType.includes("multipart")
      ? null
      : ((await request.json().catch(() => null)) as { path?: string } | null);
    // path already parsed only for JSON — for simplicity accept query via JSON only
    return NextResponse.json({ error: "Utilise action remove_file avec { path }" }, { status: 400 });
  }

  // legacy start
  if (action === "start") {
    if (!["assigned", "changes_requested"].includes(current)) {
      return NextResponse.json({ error: "Cette mission n’est plus à démarrer." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, status: current });
  }

  return NextResponse.json(
    { error: "Action inconnue (save_draft | submit | withdraw)" },
    { status: 400 },
  );
}

/** URL signée courte pour un fichier de preuve appartenant à l'apprenant (ou son tuteur via autre route). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { id: missionId } = await params;
  const path = String(new URL(request.url).searchParams.get("path") ?? "").trim();
  if (!path) return NextResponse.json({ error: "path requis" }, { status: 400 });

  const owned = await loadOwnedMission(db, missionId, session.id);
  if (!owned) {
    // Autoriser aussi le tuteur de l'assignment
    const { data: mission } = await db
      .from("tutor_missions")
      .select("id, assignment_id, proof_files")
      .eq("id", missionId)
      .maybeSingle();
    if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    const { data: assignment } = await db
      .from("tutor_assignments")
      .select("tutor_id, learner_id")
      .eq("id", (mission as { assignment_id: string }).assignment_id)
      .maybeSingle();
    if (!assignment || String((assignment as { tutor_id: string }).tutor_id) !== session.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const files = Array.isArray((mission as { proof_files?: ProofFile[] }).proof_files)
      ? (mission as { proof_files: ProofFile[] }).proof_files
      : [];
    if (!files.some((f) => f.path === path) && !path.startsWith(`${(assignment as { learner_id: string }).learner_id}/`)) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }
  } else {
    const files = Array.isArray((owned.mission as { proof_files?: ProofFile[] }).proof_files)
      ? (owned.mission as { proof_files: ProofFile[] }).proof_files
      : [];
    if (!files.some((f) => f.path === path) && !path.includes(missionId)) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }
  }

  let bucket = PROOF_BUCKET;
  let objectPath = path;
  const knownBuckets = ["public", "cfa-applications", "tutor-mission-proofs"] as const;
  for (const name of knownBuckets) {
    if (path.startsWith(`${name}:`)) {
      bucket = name;
      objectPath = path.slice(name.length + 1);
      break;
    }
  }

  if (bucket === "public") {
    const { data } = db.storage.from("public").getPublicUrl(objectPath);
    return NextResponse.json({ url: data.publicUrl, expiresIn: null });
  }

  const signed = await db.storage.from(bucket).createSignedUrl(objectPath, 60 * 10);
  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json({ error: signed.error?.message || "Signature impossible" }, { status: 400 });
  }
  return NextResponse.json({ url: signed.data.signedUrl, expiresIn: 600 });
}
