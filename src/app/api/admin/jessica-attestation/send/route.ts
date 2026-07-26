import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import {
  attestationFilename,
  jessicaAttestationPdfBase64,
} from "@/lib/jessica-contentin/jessica-attestation-pdf";
import {
  buildJessicaAttestationEmailHtml,
  type JessicaAttestationCivility,
} from "@/lib/jessica-contentin/jessica-attestation-shared";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";

type Body = {
  email?: string;
  fullName?: string;
  civility?: JessicaAttestationCivility;
  consultationDate?: string;
  consultationTime?: string;
  concerning?: string | null;
  issuedDate?: string | null;
  bodyOverride?: string | null;
  emailMessage?: string | null;
};

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const fullName = body?.fullName?.trim() ?? "";
  const civility = body?.civility === "Monsieur" ? "Monsieur" : "Madame";
  const consultationDate = body?.consultationDate?.trim() ?? "";
  const consultationTime = body?.consultationTime?.trim() ?? "";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email destinataire manquant" }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "Nom de la personne manquant" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(consultationDate)) {
    return NextResponse.json({ error: "Date de consultation invalide" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(consultationTime)) {
    return NextResponse.json({ error: "Heure de consultation invalide" }, { status: 400 });
  }

  const attestationInput = {
    civility,
    fullName,
    consultationDate,
    consultationTime,
    concerning: body?.concerning?.trim() || null,
    issuedDate: body?.issuedDate?.trim() || null,
    bodyOverride: body?.bodyOverride?.trim() || null,
  };

  const pdfBase64 = jessicaAttestationPdfBase64(attestationInput);
  const filename = attestationFilename(fullName, consultationDate);
  const firstName = fullName.split(/\s+/)[0] ?? null;
  const html = buildJessicaAttestationEmailHtml({
    recipientFirstName: firstName,
    bodyText:
      body?.emailMessage?.trim() ||
      "Veuillez trouver en pièce jointe votre attestation de présence à une consultation.",
  });

  const result = await sendJessicaResendEmail({
    to: email,
    subject: "Attestation de présence",
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBase64, "base64"),
      },
    ],
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Envoi impossible" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
