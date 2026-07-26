import { NextResponse } from "next/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { sendJessicaResendEmail } from "@/lib/jessica-contentin/jessica-resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const consultFor = String(body.consultFor ?? "").trim();
    const affiliation = body.affiliation != null ? String(body.affiliation).trim() : "";
    const childFullName =
      body.childFullName != null ? String(body.childFullName).trim() : "";

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: "Tous les champs obligatoires sont requis." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (consultFor !== "moi" && consultFor !== "tiers") {
      return NextResponse.json({ error: "Précisez pour qui vous consultez." }, { status: 400 });
    }
    if (consultFor === "tiers") {
      if (!["mon fils", "ma fille", "autre"].includes(affiliation)) {
        return NextResponse.json({ error: "Lien d'affiliation invalide." }, { status: 400 });
      }
      if (!childFullName) {
        return NextResponse.json(
          { error: "Indiquez le nom et prénom de l'enfant." },
          { status: 400 },
        );
      }
    }

    const consultLabel =
      consultFor === "moi" ? "Je consulte pour moi" : "Je consulte pour une tierce personne";

    const html = `
      <div style="font-family:Georgia,serif;color:#2F2A25;line-height:1.5">
        <h2 style="margin:0 0 12px;font-size:20px">Nouvelle demande de contact</h2>
        <p style="margin:0 0 16px;color:#5C5348">Formulaire site jessicacontentin.fr</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:6px 0;color:#8B6F47">Nom</td><td style="padding:6px 0"><strong>${escapeHtml(lastName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#8B6F47">Prénom</td><td style="padding:6px 0"><strong>${escapeHtml(firstName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#8B6F47">Email</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#8B6F47">Téléphone</td><td style="padding:6px 0"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#8B6F47">Consultation</td><td style="padding:6px 0">${escapeHtml(consultLabel)}</td></tr>
          ${
            consultFor === "tiers"
              ? `<tr><td style="padding:6px 0;color:#8B6F47">Lien</td><td style="padding:6px 0">${escapeHtml(affiliation)}</td></tr>
                 <tr><td style="padding:6px 0;color:#8B6F47">Enfant</td><td style="padding:6px 0"><strong>${escapeHtml(childFullName)}</strong></td></tr>`
              : ""
          }
        </table>
      </div>
    `;

    const result = await sendJessicaResendEmail({
      to: JESSICA_CONTENTIN_EMAIL,
      replyTo: email,
      subject: `[Contact site] ${firstName} ${lastName}${consultFor === "tiers" ? ` — ${childFullName}` : ""}`,
      html,
    });

    if (!result.success) {
      console.error("[jessica-contentin/contact]", result.error);
      return NextResponse.json(
        { error: result.error ?? "Envoi impossible pour le moment." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[jessica-contentin/contact]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
