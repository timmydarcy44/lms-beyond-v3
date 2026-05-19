import { NextResponse } from "next/server";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type AddonPayload = { id?: string; titre?: string; prix?: number };

async function sendResendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[api/postuler] Resend error:", err);
  }
}

function formatAddonsHtml(addons: AddonPayload[]): string {
  if (!addons.length) {
    return "<p><em>Aucun module complémentaire sélectionné</em></p>";
  }
  const items = addons
    .map(
      (a) =>
        `<li>${escapeHtml(String(a.titre ?? "—"))} — +${escapeHtml(String(a.prix ?? 0))}€</li>`,
    )
    .join("");
  return `<ul style="margin:8px 0;padding-left:20px;">${items}</ul>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prenom = String(body.prenom ?? "").trim();
    const nom = String(body.nom ?? "").trim();
    const email = String(body.email ?? "").trim();
    const telephone = String(body.telephone ?? "").trim();
    const situation = String(body.situation ?? "").trim();
    const source = String(body.source ?? "").trim();
    const objectif = String(body.objectif ?? "").trim();
    const financement = String(body.financement ?? "").trim();
    const motivation = String(body.motivation ?? "").trim();
    const parcours =
      String(body.parcours ?? body.parcoursTitre ?? body.parcoursSlug ?? "").trim() || "Parcours EDGE";
    const cohorte = String(body.cohorte ?? "Sept 2025").trim();
    const parcoursPrix = Number(body.parcoursPrix) || 0;
    const addonsTotal = Number(body.addonsTotal) || 0;
    const totalEstime = Number(body.totalEstime) || parcoursPrix + addonsTotal;

    const selectedAddons: AddonPayload[] = Array.isArray(body.selectedAddons)
      ? (body.selectedAddons as AddonPayload[])
      : [];

    if (!prenom || !nom || !email || !telephone) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const contactEmail = process.env.CONTACT_EMAIL?.trim() || "contact@edgebs.fr";
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "EDGE <noreply@edgebs.fr>";

    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const safe = {
        prenom: escapeHtml(prenom),
        nom: escapeHtml(nom),
        email: escapeHtml(email),
        telephone: escapeHtml(telephone),
        situation: escapeHtml(situation),
        source: escapeHtml(source || "—"),
        objectif: escapeHtml(objectif),
        financement: escapeHtml(financement),
        motivation: escapeHtml(motivation),
        parcours: escapeHtml(parcours),
        cohorte: escapeHtml(cohorte),
        parcoursPrix: escapeHtml(String(parcoursPrix)),
        addonsTotal: escapeHtml(String(addonsTotal)),
        totalEstime: escapeHtml(String(totalEstime)),
      };

      await sendResendEmail({
        from: fromAddress,
        to: contactEmail,
        subject: `Nouvelle postulation — ${parcours} — ${prenom} ${nom}`,
        replyTo: email,
        html: `
          <h2>Nouvelle postulation EDGE</h2>
          <p><strong>Parcours :</strong> ${safe.parcours}</p>
          <p><strong>Cohorte :</strong> ${safe.cohorte}</p>
          <p><strong>Nom :</strong> ${safe.prenom} ${safe.nom}</p>
          <p><strong>Email :</strong> ${safe.email}</p>
          <p><strong>Téléphone :</strong> ${safe.telephone}</p>
          <p><strong>Situation :</strong> ${safe.situation}</p>
          <p><strong>Source :</strong> ${safe.source}</p>
          <p><strong>Objectif :</strong> ${safe.objectif}</p>
          <p><strong>Financement :</strong> ${safe.financement}</p>
          <p><strong>Motivation :</strong><br/>${safe.motivation.replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p><strong>Tarif parcours :</strong> ${safe.parcoursPrix}€</p>
          <p><strong>Modules complémentaires :</strong></p>
          ${formatAddonsHtml(selectedAddons)}
          <p><strong>Total modules :</strong> +${safe.addonsTotal}€</p>
          <p><strong>Total estimé :</strong> ${safe.totalEstime}€</p>
        `,
      });

      await sendResendEmail({
        from: fromAddress,
        to: email,
        subject: `Ta postulation EDGE est bien reçue — ${parcours}`,
        replyTo: contactEmail,
        html: `
          <h2>Bonjour ${safe.prenom},</h2>
          <p>Ta postulation au parcours <strong>${safe.parcours}</strong> est bien reçue.</p>
          <p>Un membre de l'équipe EDGE te contacte dans les 48h pour un échange de 20 minutes.</p>
          ${
            selectedAddons.length > 0
              ? `<p>Modules qui t'intéressent : ${selectedAddons.map((a) => escapeHtml(String(a.titre))).join(", ")}.</p>`
              : ""
          }
          <p>Pas d'inquiétude — aucun paiement ne te sera demandé aujourd'hui.</p>
          <br/>
          <p>À très vite,<br/>L'équipe EDGE</p>
        `,
      });
    } else {
      console.log("POSTULATION REÇUE (pas de Resend configuré):", {
        prenom,
        nom,
        email,
        telephone,
        situation,
        source,
        objectif,
        financement,
        motivation,
        parcours,
        cohorte,
        parcoursPrix,
        selectedAddons,
        addonsTotal,
        totalEstime,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API postuler error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
