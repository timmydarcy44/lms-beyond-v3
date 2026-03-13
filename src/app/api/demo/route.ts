import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, email, telephone, structure, type_structure, message } = body;

    if (!nom || !email || !structure || !type_structure) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const { error } = await supabase.from("demo_requests").insert({
      nom,
      email,
      telephone,
      structure,
      type_structure,
      message,
    });

    if (error) throw error;

    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      const trimmedKey = brevoKey.trim();
      console.log("Brevo key loaded", {
        prefix: trimmedKey.slice(0, 8),
        suffix: trimmedKey.slice(-4),
        length: trimmedKey.length,
      });
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": trimmedKey,
        },
        body: JSON.stringify({
          sender: {
            name: "Beyond",
            email: "noreply@beyondcenter.fr",
          },
          to: [
            {
              email: "t.darcy@beyondcenter.fr",
              name: "Darcy",
            },
          ],
          cc: [
            {
              email: "timmydarcy44@gmail.com",
              name: "Darcy Gmail",
            },
          ],
          subject: `🔔 Nouvelle demande de démo — ${nom}`,
          htmlContent: `
          <div style="font-family: sans-serif;
            max-width: 600px; margin: 0 auto;
            background: #fff; padding: 40px;
            border-radius: 12px;">
            
            <div style="margin-bottom: 32px;">
              <h1 style="font-size: 24px;
                font-weight: 900; color: #111;
                margin: 0 0 8px;">
                Nouvelle demande de démo
              </h1>
              <p style="color: #999; 
                font-size: 13px; margin: 0;">
                Reçue le 
                ${new Date().toLocaleDateString("fr-FR")} 
                à 
                ${new Date().toLocaleTimeString("fr-FR")}
              </p>
            </div>

            <table style="width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;
                  background: #f9f9f9;">
                  Nom
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;
                  background: #f9f9f9;">
                  ${nom}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;">
                  Email
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;">
                  ${email}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;
                  background: #f9f9f9;">
                  Téléphone
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;
                  background: #f9f9f9;">
                  ${telephone || "Non renseigné"}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;">
                  Structure
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;">
                  ${structure}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;
                  background: #f9f9f9;">
                  Type
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;
                  background: #f9f9f9;">
                  ${type_structure}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;
                  color: #666; font-size: 13px;
                  width: 140px; font-weight: 500;">
                  Message
                </td>
                <td style="padding: 12px 16px;
                  color: #111; font-size: 14px;">
                  ${message || "Aucun message"}
                </td>
              </tr>
            </table>

            <div style="background: #111;
              border-radius: 10px;
              padding: 20px;
              text-align: center;">
              <p style="color: #fff;
                font-size: 14px;
                margin: 0 0 12px;
                font-weight: 600;">
                À contacter dans les 24h 🚀
              </p>
              <a href="mailto:${email}"
                style="background: #fff;
                color: #000; font-weight: 700;
                padding: 10px 24px;
                border-radius: 50px;
                text-decoration: none;
                font-size: 13px;">
                Répondre à ${nom} →
              </a>
            </div>
          </div>
        `,
        }),
      });
      if (!brevoRes.ok) {
        const brevoText = await brevoRes.text();
        console.error("Brevo error:", brevoRes.status, brevoText);
      } else {
        console.log("Brevo email sent to", "t.darcy@beyondcenter.fr");
      }
    } else {
      console.warn("BREVO_API_KEY is missing; email not sent.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Demo request error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
