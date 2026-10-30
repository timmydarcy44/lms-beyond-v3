export const CARE_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_B_Care.png";

/** Rose framboise du logo B Care. */
export const CARE_BERRY = "#C2185B";
export const CARE_BERRY_RGB: [number, number, number] = [194, 24, 91];

const CARE_RED = CARE_BERRY;
const CARE_INK = "#04140C";
const CARE_MUTED = "#5C615C";
const CARE_ON_BERRY = "#FFFFFF";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCareEmail(input: {
  preheader?: string;
  greeting: string;
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}) {
  const preheader = input.preheader ?? input.title;
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#F6F4F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${CARE_INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F4F2;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background:${CARE_RED};padding:22px 28px;text-align:center;">
              <img src="${CARE_LOGO_URL}" alt="Byound Care" width="56" height="56" style="display:inline-block;border:0;" />
              <p style="margin:10px 0 0;font-size:13px;letter-spacing:0.18em;font-weight:800;color:${CARE_ON_BERRY};text-transform:uppercase;">Byound Care</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <p style="margin:0 0 8px;font-size:15px;color:${CARE_MUTED};">${escapeHtml(input.greeting)}</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:800;color:${CARE_INK};">${escapeHtml(input.title)}</h1>
              <div style="font-size:16px;line-height:1.6;color:${CARE_INK};">${input.bodyHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 32px;text-align:center;">
              ${
                input.ctaUrl && input.ctaLabel
                  ? `<a href="${input.ctaUrl}" style="display:inline-block;background:${CARE_RED};color:${CARE_ON_BERRY};text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;">${escapeHtml(input.ctaLabel)}</a>`
                  : ""
              }
              <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:${CARE_MUTED};">
                ${input.footer ?? "Byound Care — accompagnement expert."}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
