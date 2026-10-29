import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import {
  asDocumentKind,
  parseDocumentScores,
  type CareDocumentKind,
  type PatientDocument,
} from "@/lib/care/patient-document-model";
import { formatPersonName } from "@/lib/care/person-name";
import { getServiceRoleClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ResultRow = {
  document_id: string;
  scores: unknown;
  practitioner_comment: string | null;
  published_at: string | null;
  created_at: string;
};

function safeStoragePath(value: unknown) {
  const path = String(value ?? "").trim();
  if (!path || path.includes("..") || path.startsWith("/") || path.includes("://")) return null;
  return path;
}

function visibleTest(row: ResultRow | undefined) {
  const comment = row?.practitioner_comment?.replace(/\s+/g, " ").trim() ?? "";
  if (!row?.published_at || !comment) return null;
  return {
    scores: parseDocumentScores(row.scores),
    comment,
    commentedAt: row.published_at,
    takenAt: row.created_at,
  };
}

export const loadPatientDocuments = cache(async function loadPatientDocuments(): Promise<PatientDocument[]> {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return [];
  const { data, error } = await db
    .from("care_documents")
    .select("id, kind, title, storage_path, shared_at, opened_at, practitioner_id, subject_relative_id, created_at")
    .eq("patient_account_id", session.id)
    .not("shared_at", "is", null)
    .order("shared_at", { ascending: false });
  if (error || !data) {
    if (error) console.error("[patient documents]", error.code ?? "query");
    return [];
  }

  const practitionerIds = [...new Set(data.map((row) => String(row.practitioner_id)))];
  const testIds = data.filter((row) => row.kind === "test_result").map((row) => String(row.id));
  const [{ data: profiles }, { data: results }] = await Promise.all([
    practitionerIds.length
      ? db.from("care_profiles").select("expert_id, display_name").in("expert_id", practitionerIds)
      : Promise.resolve({ data: [] as Array<{ expert_id: string; display_name: string | null }> }),
    testIds.length
      ? db
          .from("care_test_results")
          .select("document_id, scores, practitioner_comment, published_at, created_at")
          .in("document_id", testIds)
          .eq("patient_account_id", session.id)
      : Promise.resolve({ data: [] as ResultRow[] }),
  ]);
  const names = new Map((profiles ?? []).map((row) => [String(row.expert_id), formatPersonName(String(row.display_name ?? ""))]));
  const tests = new Map((results ?? []).map((row) => [String(row.document_id), row as ResultRow]));

  const documents: PatientDocument[] = [];
  for (const row of data) {
    const kind = asDocumentKind(row.kind);
    const test = kind === "test_result" ? visibleTest(tests.get(String(row.id))) : null;
    if (kind === "test_result" && !test) continue;
    documents.push({
      id: String(row.id),
      kind,
      title: String(row.title),
      sharedAt: String(row.shared_at),
      openedAt: row.opened_at ? String(row.opened_at) : null,
      practitionerName: names.get(String(row.practitioner_id)) || "Votre praticien",
      subjectRelativeId: row.subject_relative_id ? String(row.subject_relative_id) : null,
      hasFile: Boolean(safeStoragePath(row.storage_path)),
      test,
    });
  }
  return documents;
});

export function countUnopenedDocuments(documents: PatientDocument[]) {
  return documents.filter((item) => !item.openedAt).length;
}

export async function openPatientDocument(accountId: string, id: string, download: boolean) {
  const db = getServiceRoleClient();
  if (!db || !UUID_RE.test(id)) return null;
  const { data } = await db
    .from("care_documents")
    .select("id, kind, storage_path, shared_at, opened_at, patient_account_id")
    .eq("id", id)
    .eq("patient_account_id", accountId)
    .not("shared_at", "is", null)
    .maybeSingle();
  if (!data) return null;
  const kind = asDocumentKind(data.kind) as CareDocumentKind;
  if (kind === "test_result") {
    const { data: result } = await db
      .from("care_test_results")
      .select("practitioner_comment, published_at")
      .eq("document_id", id)
      .eq("patient_account_id", accountId)
      .maybeSingle();
    const comment = String(result?.practitioner_comment ?? "").trim();
    if (!result?.published_at || !comment) return null;
  }
  if (!data.opened_at) {
    await db.from("care_documents").update({ opened_at: new Date().toISOString() }).eq("id", id).eq("patient_account_id", accountId);
  }
  const path = safeStoragePath(data.storage_path);
  if (!path) return { signedUrl: null as string | null };
  const signed = await db.storage.from("care-documents").createSignedUrl(path, 60, download ? { download: true } : undefined);
  return { signedUrl: signed.data?.signedUrl ?? null };
}
