import { NextResponse } from "next/server";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nom = String(body.nom ?? "").trim();
    const email = String(body.email ?? "").trim();
    const entreprise = String(body.entreprise ?? "").trim();
    const taille = String(body.taille ?? "").trim();
    const besoin = String(body.besoin ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!nom || !email || !entreprise || !taille || !besoin || !message) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const contactEmail = process.env.CONTACT_EMAIL?.trim() || "contact@edgebs.fr";
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "EDGE <noreply@edgebs.fr>";
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: contactEmail,
          reply_to: email,
          subject: `[EDGE Entreprises] Demande — ${entreprise}`,
          html: `<p><strong>${escapeHtml(nom)}</strong> — ${escapeHtml(entreprise)}</p>
<p>Email : ${escapeHtml(email)}<br/>
Taille équipe : ${escapeHtml(taille)}<br/>
Besoin principal : ${escapeHtml(besoin)}</p>
<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[edge-entreprise-lead] Resend error:", err);
        return NextResponse.json({ error: "Envoi impossible" }, { status: 502 });
      }
    } else {
      console.warn("[edge-entreprise-lead] RESEND_API_KEY missing — lead logged only");
      console.info("[edge-entreprise-lead]", { nom, email, entreprise, taille, besoin, message });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[edge-entreprise-lead]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
