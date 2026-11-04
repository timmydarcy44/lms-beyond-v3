"use client";

import type { ExpertProjectCourse } from "@/lib/workshops/learner-project";

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ExpertProjectPdfButton({ courses }: { courses: ExpertProjectCourse[] }) {
  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    let y = 18;
    const write = (text: string, size = 11, gap = 5) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width - 28);
      const height = lines.length * gap;
      if (y + height > 282) {
        doc.addPage();
        y = 18;
      }
      doc.text(lines, 14, y);
      y += height + 2;
    };

    const validated = courses.reduce((sum, course) => sum + course.workshops.filter((item) => item.validated).length, 0);
    const total = courses.reduce((sum, course) => sum + course.workshops.length, 0);
    write("Mon projet expert", 18, 8);
    write(`${validated} atelier${validated > 1 ? "s" : ""} validé${validated > 1 ? "s" : ""} sur ${total}`, 12);
    for (const course of courses) {
      y += 3;
      write(course.title, 14, 6);
      for (const workshop of course.workshops) {
        write(`${workshop.chapterTitle} · ${workshop.title}`, 12, 5.5);
        if (!workshop.validated) {
          write("À faire", 11);
          continue;
        }
        if (workshop.validatedAt) write(`Validé le ${formatDay(workshop.validatedAt)}`, 11);
        for (const answer of workshop.answers) {
          write(`${answer.label} : ${answer.value}`, 11);
        }
        if (workshop.feedback) {
          write("Dernier retour", 12, 5.5);
          for (const criterion of workshop.feedback.criteres) {
            write(`${criterion.critere} · ${criterion.statut === "reussi" ? "Réussi" : "À améliorer"}`, 11);
            if (criterion.commentaire) write(criterion.commentaire, 11);
            if (criterion.suggestion) write(`Suggestion : ${criterion.suggestion}`, 11);
          }
          if (workshop.feedback.commentaire_global) write(workshop.feedback.commentaire_global, 11);
        }
      }
    }
    doc.save("mon-projet-expert.pdf");
  }

  return (
    <button
      type="button"
      onClick={() => void exportPdf()}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#17171F]"
    >
      Exporter en PDF
    </button>
  );
}
