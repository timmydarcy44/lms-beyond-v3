import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const BUCKETS = ["Public", "public", "pdfs"] as const;

export function newDocToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function uploadFormationPdf(
  service: SupabaseClient,
  params: { dossierId: string; kind: string; buffer: Buffer },
): Promise<{ fileUrl: string; path: string } | null> {
  const path = `formation-docs/${params.dossierId}/${params.kind}-${Date.now()}.pdf`;
  for (const bucket of BUCKETS) {
    const { error } = await service.storage.from(bucket).upload(path, params.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (!error) {
      const { data } = service.storage.from(bucket).getPublicUrl(path);
      return { fileUrl: data.publicUrl, path };
    }
  }
  return null;
}
