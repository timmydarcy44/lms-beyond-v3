import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { sendEmail } from "@/lib/email/resend-client";

export const BADGE_WALLET_URL = `${BADGE_PUBLIC_ORIGIN}/wallet`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char
  ));
}

export function openBadgeAwardEmail(badgeName: string) {
  const name = badgeName.trim() || "Open Badge";
  const subject = `Votre Open Badge « ${name} » est prêt`;
  const text = `${subject}\n\nRetrouvez-le dans votre portefeuille : ${BADGE_WALLET_URL}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;line-height:1.5;color:#111">
      <p>Votre Open Badge <strong>${escapeHtml(name)}</strong> est prêt.</p>
      <p><a href="${BADGE_WALLET_URL}" style="display:inline-block;background:#2A1466;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Ouvrir mon portefeuille</a></p>
      <p style="color:#555">Byound</p>
    </div>
  `;
  return { subject, text, html };
}

export async function sendOpenBadgeAwardEmail(email: string, badgeName: string) {
  const message = openBadgeAwardEmail(badgeName);
  try {
    await sendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      from: "Byound <noreply@byound.fr>",
      skipBcc: true,
    });
  } catch (error) {
    console.error("[open-badges] award email:", error instanceof Error ? error.message : error);
  }
}
