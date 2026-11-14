import { createHash } from "crypto";
import QRCode from "qrcode";
import { BYOUND_COMPANY, companyPostalAddress } from "@/lib/company";
import type { DossierDocContext } from "@/lib/formation-documents/context";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  formatDateAdmin,
  formatDatesShort,
  formatDuration,
  formatHours,
  sessionDays,
  slotsFromDocContext,
} from "@/lib/formation-documents/session-dates";
import { formatParisClock, parisWallToUtc } from "@/lib/formation-documents/paris-time";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";

/** QR embarqué (data URL) — évite les carrés blancs (images externes non chargées par Puppeteer). */
async function qrDataUrl(target: string, size = 140): Promise<string> {
  return QRCode.toDataURL(target, {
    type: "image/png",
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0B12", light: "#FFFFFF" },
  });
}

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(full: string): string {
  const t = full.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] || t;
}

function convocRef(dossierId: string, participantKey: string): string {
  const h = createHash("sha256")
    .update(`${dossierId}:${participantKey}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `BYB-${h}`;
}

function formatPresence(modality: string | null | undefined): string {
  const m = String(modality || "").toLowerCase();
  if (m.includes("distan")) return "Distanciel";
  if (m.includes("hybride") || m.includes("mixte")) return "Hybride";
  return "Présentiel";
}

function locationHeadline(label: string | null | undefined): {
  title: string;
  address: string;
  chips: string[];
  note: string;
} {
  const raw = String(label || "").trim();
  const lower = raw.toLowerCase();
  if (!raw || lower.includes("distan") || lower.includes("visio")) {
    return {
      title: "À distance",
      address: "Le lien de visioconférence vous sera communiqué avant la session.",
      chips: ["Visio"],
      note: "Connectez-vous 5 minutes avant le début.",
    };
  }
  if (lower.includes("byound") || lower.includes("nos locaux")) {
    const addr = raw.includes("—") ? raw.split("—").slice(1).join("—").trim() : companyPostalAddress();
    return {
      title: "Dans les locaux Byound",
      address: addr,
      chips: ["Accueil à l'entrée", "Parking à proximité"],
      note: "Sur place, présentez-vous à l'accueil en indiquant la formation Byound.",
    };
  }
  const addr = raw.includes("—") ? raw.split("—").slice(1).join("—").trim() : raw;
  return {
    title: "Dans les locaux du client",
    address: addr || raw,
    chips: ["Salle de réunion", "Parking visiteurs"],
    note: "Sur place, demandez l'accueil en indiquant la formation Byound.",
  };
}

function lunchNote(ctx: DossierDocContext): string | null {
  const slots = [...ctx.slots].sort((a, b) =>
    String(a.starts_at || a.slot_date).localeCompare(String(b.starts_at || b.slot_date)),
  );
  const morning = slots.find((s) => s.day_part === "matin");
  const afternoon = slots.find((s) => s.day_part === "apres_midi");
  if (!morning?.ends_at || !afternoon?.starts_at) return null;
  const end = formatParisClock(morning.ends_at);
  const start = formatParisClock(afternoon.starts_at);
  if (!end || !start) return null;
  return `Déjeuner libre de ${end} à ${start} · Merci d'arriver 10 minutes avant le début.`;
}

function positionnementDeadline(ctx: DossierDocContext): string | null {
  const first = [...ctx.slots]
    .map((s) => s.slot_date)
    .filter(Boolean)
    .sort()[0];
  if (!first) return null;
  const d = parisWallToUtc(first, 12, 0);
  d.setUTCDate(d.getUTCDate() - 3);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export type ConvocationHtmlOpts = {
  participantName: string;
  participantJobTitle?: string | null;
  positionnementUrl?: string | null;
  issuedAt?: Date;
  /** Data URLs pré-générées (sinon générées dans fillConvocationPdf). */
  positionnementQrDataUrl?: string | null;
  reglementQrDataUrl?: string | null;
  /** Référente handicap (of_settings) — jamais de nom en dur. */
  handicapReferentLine?: string | null;
};

export function buildConvocationHtml(
  ctx: DossierDocContext,
  opts: ConvocationHtmlOpts,
): { html: string; ref: string } {
  const name = opts.participantName.trim() || "Participant";
  const hello = firstName(name) || name;
  const ref = convocRef(ctx.dossier.id, name);
  const issuedAt = opts.issuedAt ?? new Date();
  const courseTitle =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation";
  const org = ctx.organization.name || "Entreprise cliente";
  const slots = slotsFromDocContext(ctx.slots);
  const days = sessionDays(slots);
  const dateLabel = slots.length ? formatDatesShort(slots) : "À confirmer";
  const hoursLabel = formatHours(slots) || "Selon planning";
  const durationLabel =
    ctx.course?.duration?.trim() || (slots.length ? formatDuration(slots) : "À confirmer");
  const formatLabel = formatPresence(ctx.dossier.modality_presence);
  const lieu = locationHeadline(ctx.session?.location_label);
  const lunch = lunchNote(ctx);
  const objectives = (ctx.course?.objectives?.length
    ? ctx.course.objectives
    : ctx.course?.skills?.length
      ? ctx.course.skills
      : [
          "Identifier les profils comportementaux de son équipe.",
          "Adapter sa communication et son style de management à chaque profil.",
          "Prévenir et désamorcer les tensions grâce à une lecture comportementale.",
        ]
  ).slice(0, 5);
  const prerequisites =
    ctx.course?.prerequisites?.trim() ||
    "Aucun. Une première expérience d'encadrement est un plus.";
  const badgeLabel =
    ctx.course?.level?.trim() ||
    (ctx.course?.skills?.[0] ? `Open badge · ${ctx.course.skills[0]}` : null);
  const posUrl =
    opts.positionnementUrl?.trim() ||
    `${BYOUND_PUBLIC_ORIGIN}/dashboard/formateur`;
  const posDeadline = positionnementDeadline(ctx);
  const reglementUrl = `${BYOUND_PUBLIC_ORIGIN}/reglement-interieur`;
  const programmeUrl = `${BYOUND_PUBLIC_ORIGIN}/business/formations`;

  const hoursLines = hoursLabel.includes(" et ")
    ? hoursLabel.split(" et ").map((h) => `<div>${esc(h)}</div>`).join("")
    : `<div>${esc(hoursLabel)}</div>`;

  const objectivesHtml = objectives
    .map(
      (o) =>
        `<li><span class="check">✓</span><span>${esc(o)}</span></li>`,
    )
    .join("");

  const dayCount = days.length;
  const multiDayNote =
    dayCount > 1
      ? `<div class="muted small" style="margin-top:6px;">Session sur ${dayCount} jours — horaires détaillés ci-dessus.</div>`
      : "";

  const html = `
<style>
  * { box-sizing: border-box; }
  body { margin: 0; color: #0A0B12; font-size: 10.5px; line-height: 1.4; }
  .page { padding: 14mm 14mm 12mm; width: 210mm; min-height: 297mm; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .logo { width: 28px; height: 28px; border-radius: 8px; background: #6E5BFF; color: #fff;
    font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .brand-name { font-weight: 800; font-size: 16px; letter-spacing: -0.02em; }
  .ref { color: #5B6178; font-size: 11px; font-weight: 600; }
  .hello { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 6px; }
  .hello span { color: #6E5BFF; }
  .lede { margin: 0 0 16px; color: #5B6178; font-size: 12px; max-width: 420px; }
  .layout { display: flex; gap: 14px; align-items: flex-start; }
  .main { flex: 1.35; min-width: 0; }
  .side { flex: 0.9; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
  .hero { border-radius: 18px; padding: 16px 16px 14px; color: #fff;
    background: linear-gradient(135deg, #1A1440 0%, #3A2BA0 48%, #6E5BFF 100%); }
  .hero-label { font-size: 10px; opacity: 0.8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .hero-title { margin: 6px 0 4px; font-size: 16px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; }
  .hero-who { font-size: 11px; opacity: 0.9; margin-bottom: 12px; }
  .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .fact { background: rgba(255,255,255,0.14); border-radius: 12px; padding: 9px 10px; }
  .fact .lbl { font-size: 9px; opacity: 0.8; font-weight: 700; }
  .fact .val { margin-top: 2px; font-size: 12px; font-weight: 800; line-height: 1.25; }
  .hero-note { margin-top: 10px; font-size: 10px; opacity: 0.88; }
  .block { margin-top: 14px; }
  .block h3 { margin: 0 0 8px; font-size: 13px; font-weight: 800; }
  .where-card { background: #F4F5F8; border-radius: 14px; padding: 12px 14px; }
  .where-title { font-weight: 800; font-size: 12px; }
  .where-addr { margin-top: 4px; color: #3A3D45; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .chip { background: #fff; border: 1px solid #E4E6EF; border-radius: 999px; padding: 3px 9px;
    font-size: 9.5px; font-weight: 700; color: #3A2BA0; }
  .where-note { margin-top: 8px; color: #5B6178; font-size: 10px; }
  .objectives { list-style: none; padding: 0; margin: 0; }
  .objectives li { display: flex; gap: 8px; align-items: flex-start; margin: 0 0 7px; }
  .check { color: #22C55E; font-weight: 800; flex-shrink: 0; }
  .badge-line { margin-top: 8px; font-size: 11px; font-weight: 700; color: #3A2BA0; }
  .link { color: #5B6178; font-size: 10px; margin-top: 4px; }
  .trio { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .card { background: #F4F5F8; border-radius: 12px; padding: 10px; }
  .card h4 { margin: 0 0 4px; font-size: 11px; font-weight: 800; }
  .card p { margin: 0; color: #5B6178; font-size: 9.5px; line-height: 1.35; }
  .panel { background: #F4F5F8; border-radius: 14px; padding: 12px; }
  .panel.dark { background: #0A0B12; color: #fff; }
  .panel h3 { margin: 0 0 8px; font-size: 12px; font-weight: 800; }
  .panel p { margin: 0 0 8px; color: #5B6178; font-size: 10px; }
  .panel.dark p { color: rgba(255,255,255,0.78); }
  .cta { display: inline-block; margin-top: 6px; background: #fff; color: #0A0B12; text-decoration: none;
    border-radius: 999px; padding: 8px 12px; font-size: 11px; font-weight: 800; }
  .panel.dark .cta { background: #fff; color: #0A0B12; }
  .qr { width: 72px; height: 72px; background: #fff; border-radius: 8px; padding: 3px; margin: 8px 0; }
  .checklist { list-style: none; padding: 0; margin: 0; }
  .checklist li { display: flex; gap: 7px; margin: 0 0 6px; font-size: 10.5px; }
  .contact-row { margin: 0 0 8px; }
  .contact-row strong { display: block; font-size: 10.5px; }
  .contact-row span { color: #5B6178; font-size: 10px; }
  .muted { color: #5B6178; }
  .small { font-size: 9.5px; }
  .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #E4E6EF;
    display: flex; justify-content: space-between; gap: 12px; color: #8A90A5; font-size: 8px; }
</style>
<div class="page">
  <div class="top">
    <div class="brand"><div class="logo">B</div><div class="brand-name">Byound</div></div>
    <div class="ref">Convocation ${esc(ref)}</div>
  </div>

  <h1 class="hello">Bonjour <span>${esc(hello)},</span></h1>
  <p class="lede">Votre inscription est confirmée. Voici tout ce qu'il faut savoir pour être prêt le jour J.</p>

  <div class="layout">
    <div class="main">
      <div class="hero">
        <div class="hero-label">Votre formation</div>
        <div class="hero-title">${esc(courseTitle)}</div>
        <div class="hero-who">${esc(name)} · ${esc(org)}</div>
        <div class="facts">
          <div class="fact"><div class="lbl">Date</div><div class="val">${esc(dateLabel)}</div></div>
          <div class="fact"><div class="lbl">Horaires</div><div class="val">${hoursLines}</div></div>
          <div class="fact"><div class="lbl">Durée</div><div class="val">${esc(durationLabel)}</div></div>
          <div class="fact"><div class="lbl">Format</div><div class="val">${esc(formatLabel)}</div></div>
        </div>
        ${lunch ? `<div class="hero-note">${esc(lunch)}</div>` : `<div class="hero-note">Merci d'arriver 10 minutes avant le début.</div>`}
        ${multiDayNote}
      </div>

      <div class="block">
        <h3>Où</h3>
        <div class="where-card">
          <div class="where-title">${esc(lieu.title)}</div>
          <div class="where-addr">${esc(lieu.address)}</div>
          <div class="chips">${lieu.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
          <div class="where-note">${esc(lieu.note)}</div>
        </div>
      </div>

      <div class="block">
        <h3>Ce que vous allez apprendre</h3>
        <ul class="objectives">${objectivesHtml}</ul>
        ${badgeLabel ? `<div class="badge-line">${esc(badgeLabel)}</div>` : ""}
        <div class="link">Programme complet : ${esc(programmeUrl.replace(/^https?:\/\//, ""))}</div>
      </div>

      <div class="block">
        <h3>Pendant et après</h3>
        <div class="trio">
          <div class="card">
            <h4>Émargement</h4>
            <p>Par demi-journée, sur votre téléphone, avec le code donné en salle.</p>
          </div>
          <div class="card">
            <h4>Évaluation</h4>
            <p>Exercices, mises en situation et questionnaire de satisfaction.</p>
          </div>
          <div class="card">
            <h4>À la fin</h4>
            <p>Attestation de formation et open badge si vos compétences sont validées.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="side">
      <div class="panel dark">
        <h3>Avant le jour J</h3>
        <p>Faites votre test de positionnement (10 à 15 min) : le formateur adaptera la formation à votre profil.</p>
        ${posDeadline ? `<p><strong>Avant le ${esc(posDeadline)}</strong></p>` : ""}
        ${
          opts.positionnementQrDataUrl
            ? `<img class="qr" src="${opts.positionnementQrDataUrl}" alt="QR positionnement" />`
            : ""
        }
        <div><a class="cta" href="${esc(posUrl)}">Faire mon test</a></div>
        <p style="margin-top:10px;">Prérequis : ${esc(prerequisites)}</p>
      </div>

      <div class="panel">
        <h3>À apporter</h3>
        <ul class="checklist">
          <li><span class="check">✓</span><span>Votre téléphone (émargement)</span></li>
          <li><span class="check">✓</span><span>De quoi prendre des notes</span></li>
          <li><span class="check">✓</span><span>Un exemple de situation managériale vécue</span></li>
        </ul>
      </div>

      <div class="panel">
        <h3>Contacts et infos</h3>
        <div class="contact-row">
          <strong>Un empêchement, une question</strong>
          <span>Équipe Byound · ${esc(BYOUND_COMPANY.email)}</span>
        </div>
        <div class="contact-row">
          <strong>Handicap ou besoin d'aménagement</strong>
          <span>${esc(
            opts.handicapReferentLine?.trim() ||
              "Référente handicap Byound · referent-handicap@byound.fr",
          )}</span>
        </div>
        <div class="contact-row">
          <strong>Règlement intérieur</strong>
          <span>${esc(reglementUrl.replace(/^https?:\/\//, ""))}</span>
        </div>
        ${
          opts.reglementQrDataUrl
            ? `<img class="qr" src="${opts.reglementQrDataUrl}" alt="QR règlement" />`
            : ""
        }
      </div>
    </div>
  </div>

  <div class="footer">
    <div>${esc(BYOUND_COMPANY.legal_name)} · ${esc(companyPostalAddress())} · SIRET ${esc(BYOUND_COMPANY.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4"))} · TVA ${esc(BYOUND_COMPANY.vat_intra)}</div>
    <div>Émise le ${esc(formatDateAdmin(issuedAt))}</div>
  </div>
</div>`;

  return { html, ref };
}

export async function fillConvocationPdf(
  ctx: DossierDocContext,
  opts: ConvocationHtmlOpts,
): Promise<Buffer | null> {
  try {
    const posUrl =
      opts.positionnementUrl?.trim() ||
      `${BYOUND_PUBLIC_ORIGIN}/dashboard/formateur`;
    const reglementUrl = `${BYOUND_PUBLIC_ORIGIN}/reglement-interieur`;
    let handicapReferentLine = opts.handicapReferentLine?.trim() || null;
    if (!handicapReferentLine) {
      try {
        const { getServiceRoleClient } = await import("@/lib/supabase/server");
        const { loadDisabilityReferentContact } = await import(
          "@/lib/handicap/referent-contact"
        );
        const service = getServiceRoleClient();
        if (service) {
          const contact = await loadDisabilityReferentContact(service);
          handicapReferentLine = contact.publicLine;
        }
      } catch {
        handicapReferentLine = null;
      }
    }
    const [positionnementQrDataUrl, reglementQrDataUrl] = await Promise.all([
      opts.positionnementQrDataUrl || qrDataUrl(posUrl, 140),
      opts.reglementQrDataUrl || qrDataUrl(reglementUrl, 120),
    ]);
    const { html } = buildConvocationHtml(ctx, {
      ...opts,
      handicapReferentLine,
      positionnementQrDataUrl,
      reglementQrDataUrl,
    });
    return await renderHtmlToPdf(html, {
      font: "manrope",
      fullBleed: true,
    });
  } catch (err) {
    console.error("[convocation-html] render failed:", err);
    return null;
  }
}
