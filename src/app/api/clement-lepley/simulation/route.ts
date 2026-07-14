import { NextResponse } from "next/server";

import { BUDGET_OPTIONS } from "@/lib/clement-lepley/constants";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { resolveResendFromEmail } from "@/lib/email/resend-from";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!res.ok) {
    console.error("[clement-lepley/simulation] Resend error:", await res.text());
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "Photo requise." }, { status: 400 });
    }

    const budget = String(formData.get("budget") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();

    if (!budget || !description || !firstName || !lastName || !email || !phone || !city) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    const budgetLabel =
      BUDGET_OPTIONS.find((b) => b.id === budget)?.label ?? budget;

    const bytes = await photo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = photo.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const client = getOpenAIClient();
    let simulationText =
      "Merci pour votre demande. Un conseiller Clément Lepley analysera votre projet et vous contactera sous 48 h avec une proposition personnalisée.";

    if (client) {
      try {
        const visionResponse = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert en aménagement extérieur pour Clément Lepley (terrasses, allées, nivellement, piscine). Analyse la photo et la description du client. Rédige une simulation avant/après en français, structurée (3-4 paragraphes), réaliste et adaptée au budget indiqué. Ton professionnel, chaleureux, concret.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Budget : ${budgetLabel}\nVille : ${city}\nProjet : ${description}\n\nPropose une simulation détaillée de l'aménagement extérieur possible.`,
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl, detail: "low" },
                },
              ],
            },
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });

        simulationText =
          visionResponse.choices[0]?.message?.content?.trim() ?? simulationText;
      } catch (e) {
        console.error("[clement-lepley/simulation] vision error", e);
      }
    }

    let simulationImageUrl: string | null = null;

    if (client) {
      try {
        const imagePrompt = `Photorealistic architectural visualization of a renovated French outdoor space: ${description}. Budget level: ${budgetLabel}. Professional landscaping, terrasse, natural lighting, high quality render.`;
        const imageResponse = await client.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt.slice(0, 1000),
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        simulationImageUrl = imageResponse.data[0]?.url ?? null;
      } catch (e) {
        console.warn("[clement-lepley/simulation] image generation skipped", e);
      }
    }

    const from = resolveResendFromEmail();
    const notifyTo = process.env.CONTACT_EMAIL?.trim() || "contact@edgebs.fr";

    const userHtml = `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Voici votre simulation personnalisée pour votre projet extérieur :</p>
      <div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(simulationText)}</div>
      ${simulationImageUrl ? `<p><img src="${simulationImageUrl}" alt="Simulation" style="max-width:100%;border-radius:4px;" /></p>` : ""}
      <p>Clément Lepley vous recontactera très prochainement pour affiner votre projet.</p>
    `;

    const adminHtml = `
      <p><strong>Nouvelle demande de simulation — ${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong></p>
      <p>Email : ${escapeHtml(email)}<br/>Tél. : ${escapeHtml(phone)}<br/>Ville : ${escapeHtml(city)}<br/>Budget : ${escapeHtml(budgetLabel)}</p>
      <p><strong>Projet :</strong><br/>${escapeHtml(description)}</p>
      <hr/>
      <div style="white-space:pre-wrap;">${escapeHtml(simulationText)}</div>
    `;

    const emailSentToUser = await sendResendEmail({
      from,
      to: email,
      subject: "Votre simulation extérieur — Clément Lepley",
      html: userHtml,
      replyTo: notifyTo,
    });

    await sendResendEmail({
      from,
      to: notifyTo,
      subject: `[Clément Lepley] Simulation — ${firstName} ${lastName}`,
      html: adminHtml,
      replyTo: email,
    });

    return NextResponse.json({
      simulationText,
      simulationImageUrl,
      emailSent: emailSentToUser,
    });
  } catch (e) {
    console.error("[clement-lepley/simulation]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
