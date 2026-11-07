import { jsPDF } from "jspdf";
import type { BpfDraft, BpfLine } from "@/lib/formation-bpf/compute";

function euros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatValue(line: BpfLine): string {
  if (line.unit === "eur_ht") return euros(line.value);
  if (line.unit === "hours") return `${line.value.toFixed(1)} h`;
  return String(line.value);
}

export function buildBpfDraftPdf(draft: BpfDraft): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = 18;

  const write = (text: string, opts?: { bold?: boolean; size?: number }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.size ?? 10);
    const lines = doc.splitTextToSize(text, 178);
    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  };

  write("BPF — Brouillon Cerfa 10443", { bold: true, size: 16 });
  write(`Exercice du ${draft.period.start} au ${draft.period.end}`, { size: 11 });
  write(`Anomalies : ${draft.anomalies.length}`, { size: 10 });
  y += 4;

  write("Cadre A — Identification", { bold: true, size: 12 });
  for (const [k, v] of Object.entries(draft.cadre_a)) {
    write(`${k} : ${v || "—"}`);
  }
  y += 2;
  write("Cadre B — Exercice", { bold: true, size: 12 });
  for (const [k, v] of Object.entries(draft.cadre_b)) {
    write(`${k} : ${v || "—"}`);
  }

  const sections: Array<[string, BpfLine[]]> = [
    ["Cadre C — Produits de formation (HT)", draft.cadre_c],
    ["Cadre D — Charges", draft.cadre_d],
    ["Cadre E — Intervenants", draft.cadre_e],
    ["Cadre F-1 — Stagiaires par statut", draft.cadre_f1],
    ["Cadre F-2 — Formation confiée", draft.cadre_f2],
    ["Cadre F-3 — Par objectif", draft.cadre_f3],
    ["Cadre F-4 — Spécialités NSF", draft.cadre_f4],
    ["Cadre G — Sous-traitance reçue", draft.cadre_g],
  ];

  for (const [title, lines] of sections) {
    y += 3;
    write(title, { bold: true, size: 12 });
    for (const line of lines) {
      write(`${line.label} : ${formatValue(line)}`);
    }
  }

  if (draft.anomalies.length) {
    y += 4;
    write("Anomalies", { bold: true, size: 12 });
    for (const a of draft.anomalies) {
      write(`• ${a.message}`);
    }
  }

  write("Document généré par Byound — à reporter manuellement sur Mon Activité Formation.", {
    size: 8,
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export function buildBpfCsv(draft: BpfDraft): string {
  const rows: string[] = ["cadre,key,label,value,unit,source_id,source_label"];
  const push = (cadre: string, lines: BpfLine[]) => {
    for (const line of lines) {
      if (!line.sources.length) {
        rows.push(
          [cadre, line.key, JSON.stringify(line.label), line.value, line.unit, "", ""].join(","),
        );
      } else {
        for (const s of line.sources) {
          rows.push(
            [
              cadre,
              line.key,
              JSON.stringify(line.label),
              s.amount ?? line.value,
              line.unit,
              s.id,
              JSON.stringify(s.label),
            ].join(","),
          );
        }
      }
    }
  };
  push("C", draft.cadre_c);
  push("D", draft.cadre_d);
  push("E", draft.cadre_e);
  push("F1", draft.cadre_f1);
  push("F2", draft.cadre_f2);
  push("F3", draft.cadre_f3);
  push("F4", draft.cadre_f4);
  push("G", draft.cadre_g);
  for (const a of draft.anomalies) {
    rows.push(
      ["anomaly", a.code, JSON.stringify(a.message), "", "", a.dossier_id || "", ""].join(","),
    );
  }
  return rows.join("\n");
}
