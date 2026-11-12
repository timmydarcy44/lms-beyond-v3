import type { SurMesureCourse } from "@/lib/training-courses/surmesure-ui";
import { buildSessionPlan } from "@/lib/training-courses/surmesure-planning";
import { splitPrerequisites } from "@/lib/training-courses/surmesure-ui";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSurMesurePresentationEmailHtml(params: {
  course: SurMesureCourse;
  organizationName: string;
  recipientName?: string | null;
  personalNote?: string | null;
}) {
  const { course, organizationName, recipientName, personalNote } = params;
  const objectives = (course.objectives ?? []).filter(Boolean);
  const skills = (course.skills ?? []).filter(Boolean);
  const audience = (course.audience ?? []).filter(Boolean);
  const prerequisites = splitPrerequisites(course.prerequisites).filter(Boolean);
  const plan = buildSessionPlan(course.program_structure ?? [], course.duration);

  const hello = recipientName?.trim() ? `Bonjour ${esc(recipientName.trim())},` : "Bonjour,";

  const objectiveLis = objectives
    .map((o) => `<li style="margin:0 0 8px;color:#E8ECF8;">${esc(o)}</li>`)
    .join("");
  const skillLis = skills
    .map((s) => `<li style="margin:0 0 8px;color:#E8ECF8;">${esc(s)}</li>`)
    .join("");
  const planRows: string[] = [];
  for (let i = 0; i < plan.length; i += 2) {
    const cells = [plan[i], plan[i + 1]].filter(Boolean).map((slot) => {
      const sections = slot!.sections.length
        ? slot!.sections
            .map(
              (s, si) =>
                `<div style="margin:0 0 6px;color:#C9D2E8;font-size:14px;"><strong style="color:#fff;">Section ${(slot!.sectionIndexes[si] ?? si) + 1}</strong> — ${esc(s.title)}</div>`,
            )
            .join("")
        : `<div style="color:#8A93AE;font-size:14px;">À préciser</div>`;
      return `<td style="width:50%;vertical-align:top;padding:8px;">
        <div style="border:1px solid rgba(167,139,250,0.28);border-radius:16px;background:rgba(28,18,52,0.72);padding:14px;">
          <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;">${esc(slot!.label)}</div>
          <div style="margin-top:10px;">${sections}</div>
        </div>
      </td>`;
    });
    if (cells.length === 1) cells.push(`<td style="width:50%;padding:8px;"></td>`);
    planRows.push(`<tr>${cells.join("")}</tr>`);
  }
  const planBlocks = planRows.join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0618;color:#F7F5FF;font-family:Inter,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px 18px 40px;">
    <div style="border-radius:28px;overflow:hidden;border:1px solid rgba(167,139,250,0.28);background:linear-gradient(160deg,#1A1440 0%,#111831 55%,#0A0618 100%);">
      <div style="padding:28px 24px 18px;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#C4B8FF;font-weight:700;">Byound · Sur-mesure</div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;letter-spacing:-0.03em;color:#fff;">${esc(course.title)}</h1>
        <p style="margin:10px 0 0;color:#B7A9D9;font-size:14px;">${esc(organizationName)}${course.duration ? ` · ${esc(course.duration)}` : ""}${course.level ? ` · ${esc(course.level)}` : ""}</p>
      </div>
      <div style="padding:0 24px 24px;">
        <p style="margin:0 0 14px;color:#E8ECF8;font-size:15px;line-height:1.5;">${hello}</p>
        <p style="margin:0 0 18px;color:#C9D2E8;font-size:15px;line-height:1.55;">
          Voici la présentation de la formation co-construite avec vous.
        </p>
        ${
          personalNote?.trim()
            ? `<p style="margin:0 0 18px;padding:12px 14px;border-radius:14px;background:rgba(123,97,255,0.16);color:#E8ECF8;font-size:14px;line-height:1.5;">${esc(personalNote.trim())}</p>`
            : ""
        }
        ${
          course.short_description
            ? `<div style="margin:0 0 22px;padding:16px;border-radius:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;">Intention</div>
                <p style="margin:8px 0 0;color:#E8ECF8;font-size:15px;line-height:1.55;">${esc(course.short_description)}</p>
              </div>`
            : ""
        }
        ${
          objectiveLis
            ? `<div style="margin:0 0 22px;">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;margin-bottom:10px;">Objectifs pédagogiques</div>
                <ul style="margin:0;padding-left:18px;">${objectiveLis}</ul>
              </div>`
            : ""
        }
        ${
          audience.length || prerequisites.length
            ? `<div style="margin:0 0 22px;">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;margin-bottom:10px;">Public & prérequis</div>
                ${audience.length ? `<p style="margin:0 0 8px;color:#C9D2E8;font-size:14px;"><strong style="color:#fff;">Public</strong> — ${esc(audience.join(" · "))}</p>` : ""}
                ${prerequisites.length ? `<p style="margin:0;color:#C9D2E8;font-size:14px;"><strong style="color:#fff;">Prérequis</strong> — ${esc(prerequisites.join(" · "))}</p>` : ""}
              </div>`
            : ""
        }
        ${
          plan.length
            ? `<div style="margin:0 0 22px;">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;margin-bottom:10px;">Planning</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${planBlocks}</table>
              </div>`
            : ""
        }
        ${
          skillLis
            ? `<div style="margin:0 0 8px;">
                <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C4B8FF;font-weight:700;margin-bottom:10px;">Compétences visées</div>
                <ul style="margin:0;padding-left:18px;">${skillLis}</ul>
              </div>`
            : ""
        }
      </div>
    </div>
    <p style="margin:18px 8px 0;color:#8A93AE;font-size:12px;line-height:1.45;">
      Formation Sur-mesure Byound · document de présentation. On pourra avancer sur le cadre (dates, formateur, modalités) à votre rythme.
    </p>
  </div>
</body>
</html>`;
}
