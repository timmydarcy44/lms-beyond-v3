import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prenom = String(body?.prenom || "").trim();
    const nom = String(body?.nom || "").trim();
    const email = String(body?.email || "").trim();
    const discTestUrl = String(body?.discTestUrl || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const displayName = [prenom, nom].filter(Boolean).join(" ").trim() || "Bonjour";
    const ctaUrl = discTestUrl || "https://getbeyond.fr/particuliers/disc-test";

    const html = `
      <div style="font-family:Arial,sans-serif;background:#0B0B0B;padding:32px;color:#ffffff;">
        <div style="max-width:600px;margin:0 auto;background:#111111;border-radius:16px;padding:32px;">
          <div style="font-size:12px;letter-spacing:6px;font-weight:700;">BEYOND</div>
          <h1 style="font-size:24px;margin:16px 0 8px;">Bienvenue ${displayName} 👋</h1>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6;">
            Ton compte est bien créé. Tu peux maintenant compléter ton test DISC
            pour débloquer ton profil comportemental certifié Beyond.
          </p>
          <a href="${ctaUrl}" style="display:inline-block;margin-top:20px;background:#F97316;color:#0B0B0B;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;">
            Commencer mon test DISC
          </a>
          <p style="margin-top:16px;color:#94a3b8;font-size:12px;">
            Tu recevras ensuite le lien vers tes résultats DISC et ton profil public.
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: "Bienvenue sur Beyond — Ton test DISC t'attend",
      html,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Email non envoyé." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-confirmation]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
