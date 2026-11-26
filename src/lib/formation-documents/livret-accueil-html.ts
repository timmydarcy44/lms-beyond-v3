/**
 * Livret d'accueil Qualiopi — source unique HTML → PDF (version 1.1).
 * Aligné avec `src/lib/qualiopi/public-copy.ts`.
 */
import { BYOUND_COMPANY, companyPostalAddress } from "@/lib/company";
import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  QUALIOPI_ACCESS_DELAYS_COPY,
  QUALIOPI_ATTENDANCE_COPY,
  QUALIOPI_COMPLAINTS_COPY,
  QUALIOPI_FINANCING_COPY,
  QUALIOPI_LIVRET_VERSION_LABEL,
  QUALIOPI_PUBLIC_CONTACT_EMAIL,
  QUALIOPI_SCHEDULE_COPY,
} from "@/lib/qualiopi/public-copy";

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLivretAccueilHtml(): string {
  const email = QUALIOPI_PUBLIC_CONTACT_EMAIL;
  const address = companyPostalAddress();
  const siret = BYOUND_COMPANY.siret.replace(
    /(\d{3})(\d{3})(\d{3})(\d{5})/,
    "$1 $2 $3 $4",
  );

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Livret d'accueil — Byound Business</title>
<style>
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #0A0B12;
    font-family: Manrope, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10.5px;
    line-height: 1.45;
  }
  h1 { font-size: 22px; margin: 0 0 6px; letter-spacing: -0.03em; }
  h2 {
    font-size: 13px;
    margin: 18px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #E4E6EF;
    letter-spacing: -0.01em;
  }
  h3 { font-size: 11px; margin: 10px 0 4px; }
  p { margin: 0 0 8px; }
  .cover {
    min-height: 260mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8mm 0;
  }
  .brand { font-weight: 800; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #3A2BA0; }
  .cover-title { font-size: 36px; font-weight: 800; letter-spacing: -0.04em; margin: 40px 0 12px; line-height: 1.05; }
  .cover-lede { color: #5B6178; font-size: 13px; max-width: 420px; }
  .meta { color: #5B6178; font-size: 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin: 12px 0 16px; }
  .cell .lbl { font-size: 9px; font-weight: 700; color: #5B6178; text-transform: uppercase; letter-spacing: 0.04em; }
  .cell .val { margin-top: 2px; font-weight: 700; }
  .row { display: grid; grid-template-columns: 140px 1fr; gap: 10px; margin: 0 0 10px; }
  .row .k { font-weight: 800; }
  .pill {
    display: inline-block;
    background: #F4F5F8;
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 9.5px;
    font-weight: 700;
    color: #3A2BA0;
  }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .card { background: #F4F5F8; border-radius: 12px; padding: 10px; }
  .card strong { display: block; margin-bottom: 4px; }
  .note { color: #5B6178; font-size: 9.5px; margin-top: 8px; }
  .footer {
    margin-top: 18px;
    padding-top: 8px;
    border-top: 1px solid #E4E6EF;
    color: #8A90A5;
    font-size: 8px;
  }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
  <section class="cover">
    <div>
      <div class="brand">Byound Business · Organisme de formation</div>
      <div class="cover-title">Livret<br/>d'accueil.</div>
      <p class="cover-lede">Tout ce qu'il faut savoir avant, pendant et après votre formation.</p>
    </div>
    <div class="meta">${esc(QUALIOPI_LIVRET_VERSION_LABEL)} · Bretteville-sur-Odon · Normandie</div>
  </section>

  <section class="page-break">
    <h1>Livret d'accueil</h1>
    <p>Bienvenue chez Byound Business. Voici ce qu'il faut savoir avant de commencer votre formation.</p>
    <p class="note">Informations générales remises à chaque bénéficiaire, quel que soit le programme suivi. ${esc(QUALIOPI_LIVRET_VERSION_LABEL)}</p>

    <div class="grid">
      <div class="cell"><div class="lbl">Siège social</div><div class="val">${esc(address)}</div></div>
      <div class="cell"><div class="lbl">SIREN</div><div class="val">${esc(BYOUND_COMPANY.siren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"))}</div></div>
      <div class="cell"><div class="lbl">TVA intracommunautaire</div><div class="val">${esc(BYOUND_COMPANY.vat_intra)}</div></div>
      <div class="cell"><div class="lbl">Contact</div><div class="val">${esc(email)}</div></div>
      <div class="cell"><div class="lbl">Référent handicap</div><div class="val">Jessica Contentin · ${esc(email)}</div></div>
      <div class="cell"><div class="lbl">SIRET</div><div class="val">${esc(siret)}</div></div>
    </div>

    <h2>Qui nous sommes</h2>
    <p>Byound Business est un organisme de formation professionnelle continue basé à Bretteville-sur-Odon (Caen, Normandie). Il conçoit, commercialise et anime des formations, notamment dans le management et l'intelligence artificielle.</p>
    <p>Nous accompagnons les professionnels, les entreprises et leurs équipes dans le développement de leurs compétences, avec des formations concrètes, directement applicables dans leur quotidien de travail.</p>

    <div class="cards">
      <div class="card"><strong>01 · Pédagogie concrète</strong>Cas pratiques et mises en situation réelles.</div>
      <div class="card"><strong>02 · Transparence</strong>Modalités, coûts et conditions communiqués avant inscription.</div>
      <div class="card"><strong>03 · Accompagnement</strong>Adapté au niveau et aux besoins de chaque bénéficiaire.</div>
      <div class="card"><strong>04 · Amélioration continue</strong>À partir des retours de satisfaction.</div>
    </div>
  </section>

  <section class="page-break">
    <h2>Accéder à nos formations</h2>
    <div class="row"><div class="k">Prise de contact</div><div>Toute demande est adressée à ${esc(email)}. Un échange préalable permet de qualifier le besoin et de vérifier l'adéquation entre les objectifs du bénéficiaire et le contenu proposé.</div></div>
    <div class="row"><div class="k">Devis et convention</div><div>Un devis détaillé est transmis, suivi d'une convention de formation qui fixe les conditions précises de la session (objectifs, programme, dates, durée, prix).</div></div>
    <div class="row"><div class="k">Délai d'accès</div><div>${esc(QUALIOPI_ACCESS_DELAYS_COPY)}</div></div>
    <div class="row"><div class="k">Financement</div><div>${esc(QUALIOPI_FINANCING_COPY)}</div></div>
    <div class="row"><div class="k">Référent pédagogique et administratif</div><div>Votre interlocuteur unique avant, pendant et après la formation : ${esc(email)}.</div></div>

    <h2>Le déroulement d'une formation</h2>
    <div class="row"><div class="k">Formats proposés</div><div>Présentiel dans les locaux de Byound Business (${esc(address)}), dans les locaux du client, ou e-learning asynchrone sur la plateforme Byound (parcours suivi en autonomie, sans horaire imposé), selon les besoins.</div></div>
    <div class="row"><div class="k">Rythme</div><div>${esc(QUALIOPI_SCHEDULE_COPY)}</div></div>
    <div class="row"><div class="k">Suivi / émargement</div><div>${esc(QUALIOPI_ATTENDANCE_COPY)} Pour l'e-learning asynchrone, le suivi s'appuie sur les temps de connexion et la progression enregistrés sur la plateforme.</div></div>
    <div class="row"><div class="k">À l'issue</div><div>Une attestation de fin de formation et un certificat de réalisation sont remis à l'entreprise et au(x) participant(s).</div></div>
    <p class="note"><span class="pill">Varie selon la formation</span> Intitulé, objectifs, dates, durée, effectif et programme — précisés dans la convention et le programme pédagogique de chaque session.</p>
  </section>

  <section class="page-break">
    <h2>Évaluation des acquis</h2>
    <p>L'évaluation des acquis se déroule en trois temps, pour mesurer la progression de chaque bénéficiaire.</p>
    <div class="row"><div class="k">Avant</div><div>Un test de positionnement permet d'évaluer le niveau initial et de vérifier l'adéquation de la formation.</div></div>
    <div class="row"><div class="k">Pendant</div><div>Évaluation continue des acquis (quiz, exercices d'application).</div></div>
    <div class="row"><div class="k">À l'issue</div><div>Évaluation finale des compétences visées (quiz final le cas échéant).</div></div>

    <h2>Accessibilité et handicap</h2>
    <p>Byound Business s'engage à étudier toute demande d'aménagement pour un bénéficiaire en situation de handicap. Ces demandes doivent être signalées le plus tôt possible, avant l'entrée en formation.</p>
    <p><strong>Référent handicap</strong> — Jessica Contentin · ${esc(email)}</p>

    <h2>Réclamations</h2>
    <p>${esc(QUALIOPI_COMPLAINTS_COPY)}</p>

    <h2>Règlement intérieur</h2>
    <p>Les règles essentielles de vie en formation. Le règlement intérieur complet applicable aux stagiaires est remis avec le présent livret avant l'entrée en formation.</p>
    <div class="cards">
      <div class="card"><strong>Assiduité</strong>Suivre l'intégralité de la formation et émarger à chaque demi-journée. Toute absence doit être signalée rapidement.</div>
      <div class="card"><strong>Respect</strong>Comportement respectueux envers le formateur et les autres bénéficiaires.</div>
      <div class="card"><strong>Confidentialité</strong>Supports pédagogiques propriété de Byound Business. Pas d'enregistrement sans accord préalable.</div>
      <div class="card"><strong>Sécurité</strong>En locaux Byound, se conformer aux consignes communiquées en début de session.</div>
    </div>

    <h2>Protection des données</h2>
    <p>Les données personnelles des bénéficiaires sont collectées aux seules fins de gestion administrative et pédagogique, conformément au RGPD. Droit d'accès, de rectification, d'opposition et d'effacement : ${esc(email)}.</p>

    <div class="footer">
      ${esc(BYOUND_COMPANY.legal_name)} · ${esc(address)} · SIRET ${esc(siret)} · TVA ${esc(BYOUND_COMPANY.vat_intra)} · ${esc(QUALIOPI_LIVRET_VERSION_LABEL)}
    </div>
  </section>
</body>
</html>`;
}

export async function fillLivretAccueilPdf(): Promise<Buffer> {
  const html = buildLivretAccueilHtml();
  const pdf = await renderHtmlToPdf(html, { font: "manrope" });
  if (!pdf) throw new Error("Génération du livret d'accueil impossible");
  return pdf;
}
