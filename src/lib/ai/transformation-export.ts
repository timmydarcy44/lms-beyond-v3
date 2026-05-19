/** Téléchargement, impression et copie des résultats de transformation IA. */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

/** Force des couleurs compatibles html2canvas (évite lab/oklch). */
function fixColorsForCanvas(clonedDoc: Document) {
  const elements = clonedDoc.querySelectorAll("*");
  elements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const style = window.getComputedStyle(el);
    if (style.color.includes("lab") || style.color.includes("oklch")) {
      el.style.color = "#1f2937";
    }
    if (style.backgroundColor.includes("lab") || style.backgroundColor.includes("oklch")) {
      el.style.backgroundColor = "#ffffff";
    }
    if (style.borderColor.includes("lab") || style.borderColor.includes("oklch")) {
      el.style.borderColor = "#e5e7eb";
    }
  });
}

async function captureElementToCanvas(target: HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(target, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => fixColorsForCanvas(clonedDoc),
  });
}

/** Attend le rendu Mermaid (SVG) avant capture. */
export async function waitForDiagramsReady(root: HTMLElement | null, maxMs = 4000) {
  if (!root) return;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const blocks = root.querySelectorAll("[aria-label='Schéma']");
    if (blocks.length === 0) return;
    const allReady = Array.from(blocks).every((b) => b.querySelector("svg"));
    if (allReady) return;
    await new Promise((r) => setTimeout(r, 120));
  }
}

export async function exportElementAsPng(target: HTMLElement | null, filename: string): Promise<boolean> {
  if (!target) return false;
  await waitForDiagramsReady(target);
  const canvas = await captureElementToCanvas(target);
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(filename, blob);
  return true;
}

export async function exportElementAsPdf(target: HTMLElement | null, filename: string): Promise<boolean> {
  if (!target) return false;
  await waitForDiagramsReady(target);
  const canvas = await captureElementToCanvas(target);
  const { jsPDF } = await import("jspdf");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(filename);
  return true;
}

export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

/** Copie HTML formaté (Word, Google Docs) + texte brut de secours. */
export async function copyRichContent(html: string, plainFallback: string): Promise<boolean> {
  const plain = plainFallback || htmlToPlainText(html);
  try {
    if (typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    // fallback
  }
  try {
    await navigator.clipboard.writeText(plain);
    return false;
  } catch {
    return false;
  }
}

/** Ouvre une fenêtre d’impression à partir du HTML déjà rendu dans le DOM. */
export function printDomElement(element: HTMLElement | null, documentTitle: string) {
  if (!element) {
    return false;
  }
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    return false;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 800px; margin: 1.5rem auto; padding: 0 1rem; }
    img, svg { max-width: 100%; height: auto; }
    h2, h3, h4 { margin-top: 1.25rem; }
    @media print { body { margin: 0.6in; } }
  </style>
</head>
<body>${element.innerHTML}</body>
</html>`);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
  return true;
}
