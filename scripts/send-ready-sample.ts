/**
 * Envoie un mail de test « Merci — devis accepté » + bloc Byound Ready.
 *
 *   pnpm exec tsx scripts/send-ready-sample.ts
 *   pnpm exec tsx scripts/send-ready-sample.ts toi@example.com
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const TO = (process.argv[2] || "timmydarcy44@gmail.com").trim().toLowerCase();
/** Account management · Printngo — a un devis + participants. */
const DOSSIER = "5c2e8c3e-5b7e-4e41-b853-f094c4101736";

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");
  if (!process.env.READY_ENCRYPTION_KEY) throw new Error("READY_ENCRYPTION_KEY manquant");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env manquant");

  const service = createClient(url, key);
  const { data: devis } = await service
    .from("formation_documents")
    .select("id, access_token, status")
    .eq("dossier_id", DOSSIER)
    .eq("kind", "devis")
    .maybeSingle();
  if (!devis?.id || !devis.access_token) {
    throw new Error("Devis introuvable sur le dossier sample");
  }

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("contact_name, contact_email, course_title")
    .eq("id", DOSSIER)
    .maybeSingle();

  // Force le destinataire de test sans toucher le dossier en base
  const originalEmail = dossier?.contact_email;
  await service
    .from("formation_dossiers")
    .update({ contact_email: TO, updated_at: new Date().toISOString() })
    .eq("id", DOSSIER);

  try {
    const { notifyClientDevisAccepted } = await import(
      "../src/lib/formation-documents/notify-acceptance"
    );
    await notifyClientDevisAccepted(service, {
      dossierId: DOSSIER,
      signedAt: new Date().toISOString(),
      signerName: String(dossier?.contact_name || "Timmy"),
      accessToken: String(devis.access_token),
      documentId: String(devis.id),
    });
    console.log(`✓ Mail Ready sample envoyé à ${TO}`);
    console.log(`  Formation : ${dossier?.course_title || "?"}`);
    console.log(`  Devis doc  : ${devis.id} (${devis.status})`);
  } finally {
    if (originalEmail != null) {
      await service
        .from("formation_dossiers")
        .update({
          contact_email: originalEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", DOSSIER);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
