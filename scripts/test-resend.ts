import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env.local");
let envRaw = "";
if (fs.existsSync(envPath)) {
  const buffer = fs.readFileSync(envPath);
  envRaw = buffer.toString("utf8");
  if (envRaw.includes("\u0000")) {
    envRaw = buffer.toString("utf16le");
  }
}
const hasKeyInFile = /(^|\n)\s*RESEND_API_KEY\s*=/.test(envRaw);

console.log(`.env.local path: ${envPath}`);
console.log(`RESEND_API_KEY present in file: ${hasKeyInFile ? "yes" : "no"}`);

dotenv.config({ path: envPath, override: true });

let extractedKey = "";
if (hasKeyInFile) {
  const match = envRaw.match(/(^|\n)\s*RESEND_API_KEY\s*=\s*(.*)/);
  if (match?.[2]) {
    extractedKey = match[2].trim();
  }
}

if (!process.env.RESEND_API_KEY && extractedKey) {
  process.env.RESEND_API_KEY = extractedKey;
}

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.log(
    `RESEND_API_KEY extracted length: ${extractedKey ? extractedKey.length : 0}`
  );
  console.log("RESEND_API_KEY charge: non");
  throw new Error("RESEND_API_KEY manquant dans .env.local");
}

console.log(`RESEND_API_KEY charge: ${apiKey.slice(0, 3)}***`);

const resend = new Resend(apiKey);

async function main() {
  const currentUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const siteHost = currentUrl ? new URL(currentUrl).hostname : "nevo-app.fr";
  const isNevo = siteHost.includes("nevo");
  const siteName = isNevo ? "Nevo" : "Jessica Contentin";
  const fromEmail = process.env.RESEND_FROM_EMAIL || `${siteName} <hello@${siteHost}>`;

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: "timmydarcy44@gmail.com",
    subject: `Test Configuration Resend - ${siteName}`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f9fafb; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px; border:1px solid #e5e7eb;">
          <h1 style="color:#be1354; margin:0 0 12px;">Configuration DNS IONOS réussie ✅</h1>
          <p style="font-size:16px; color:#111827; margin:0 0 8px;">
            Ce message confirme que votre domaine <strong>${siteHost}</strong> est correctement configuré avec Resend.
          </p>
          <p style="font-size:14px; color:#6b7280; margin:0;">
            Vous pouvez maintenant envoyer vos emails transactionnels en toute sécurité.
          </p>
          <p style="font-size:14px; color:#6b7280; margin:16px 0 0;">
            L'équipe ${siteName}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Erreur Resend:", error);
    process.exit(1);
  }

  console.log("Email envoyé:", data?.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
