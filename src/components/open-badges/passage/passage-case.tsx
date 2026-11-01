"use client";

import { useEffect, useRef, useState } from "react";
import { AlignLeft, Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { caseMaterialsOf, getCaseStudyContext, getCaseStudyLearnerPrompt, type BadgeMethodConfig, type CaseMaterial } from "@/lib/openbadges/badge-method-config";
import { fileBlob, pieceKind, readCaseZip } from "@/lib/openbadges/case-zip";
import { PassageButton } from "@/components/open-badges/passage/passage-chrome";

type OpenPiece = { id: string; name: string; kind: "pdf" | "sheet" | "image" | "text" | "note" | "other"; url?: string; data?: Uint8Array; text?: string };

const TOOLS: Array<{ label: string; icon: typeof Bold; command: string; value?: string }> = [
  { label: "Gras", icon: Bold, command: "bold" },
  { label: "Italique", icon: Italic, command: "italic" },
  { label: "Souligné", icon: Underline, command: "underline" },
  { label: "Liste", icon: List, command: "insertUnorderedList" },
  { label: "Liste numérotée", icon: ListOrdered, command: "insertOrderedList" },
  { label: "Paragraphe", icon: AlignLeft, command: "formatBlock", value: "P" },
];

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function PassageCase({
  method,
  warning,
  secondsLeft,
  onSubmit,
}: {
  method: BadgeMethodConfig;
  warning: string;
  secondsLeft?: number | null;
  onSubmit: (text: string) => void;
}) {
  const context = getCaseStudyContext(method);
  const brief = getCaseStudyLearnerPrompt(method);
  const materials = caseMaterialsOf(method);
  const [piece, setPiece] = useState<OpenPiece | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const pasteRef = useRef(0);
  const sentRef = useRef(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tab, setTab] = useState<"dossier" | "reponse">("reponse");
  const [count, setCount] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const ago = savedAt == null ? null : Math.max(0, Math.round((Date.now() - savedAt) / 1000));

  const send = (forced = false) => {
    if (sentRef.current) return;
    const text = (editorRef.current?.innerText ?? "").replace(/\s+/g, " ").trim();
    if (!text && !forced) return;
    sentRef.current = true;
    const html = editorRef.current?.innerHTML?.trim() ?? "";
    const pasted = pasteRef.current > 0 ? `\n\nCollage depuis l'extérieur : ${pasteRef.current} caractères.` : "";
    onSubmit(`${html}${pasted}`);
  };

  useEffect(() => {
    if (secondsLeft === 0) send(true);
  }, [secondsLeft]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const note = () => {
    setCount(words(editorRef.current?.innerText ?? ""));
    setSavedAt(Date.now());
  };

  const dossier = (
    <div className="space-y-4">
      <button type="button" onClick={() => setPanelOpen((open) => !open)} className="text-sm text-[#C9C2FF]">
        {panelOpen ? "Masquer le dossier" : "Afficher le dossier"}
      </button>
      {panelOpen ? (
        <>
          {context ? (
            <div>
              <p className="text-xs text-[#8A8FA3]">Contexte</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#B4B8C8]">{context}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-[#8A8FA3]">Consigne</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#F2F2F5]" data-passage-prompt>
              {brief || "La consigne n'est pas encore rédigée."}
            </p>
          </div>
          <p className="text-xs text-[#8A8FA3]">Sélectionnez une information pour la surligner. Elle rejoint Mes prises de note.</p>
          <DossierList materials={materials} activeId={piece?.id ?? ""} onOpen={(next) => { setPiece(next); setTab("reponse"); }} />
        </>
      ) : null}
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex gap-2 lg:hidden">
        <button type="button" onClick={() => setTab("dossier")} style={tab === "dossier" ? { background: "var(--passage-action)", color: "var(--passage-action-text)" } : undefined} className={`rounded-full px-3 py-1 text-sm ${tab === "dossier" ? "" : "text-[#B4B8C8]"}`}>
          Dossier
        </button>
        <button type="button" onClick={() => setTab("reponse")} style={tab === "reponse" ? { background: "var(--passage-action)", color: "var(--passage-action-text)" } : undefined} className={`rounded-full px-3 py-1 text-sm ${tab === "reponse" ? "" : "text-[#B4B8C8]"}`}>
          Ma réponse
        </button>
      </div>
      <div className={`grid gap-6 ${panelOpen ? "lg:grid-cols-[minmax(260px,380px)_1fr]" : ""}`}>
        <section className={tab === "reponse" ? "hidden lg:block" : ""}>{dossier}</section>
        <section className={`overflow-hidden rounded-3xl border border-[#1E2130] bg-[#15171E] ${tab === "dossier" ? "hidden lg:block" : ""}`}>
          {piece ? <PieceView piece={piece} onClose={() => setPiece(null)} /> : null}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#1E2130] px-3 py-2">
            {TOOLS.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.label}
                aria-label={item.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => exec(item.command, item.value)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E2130] text-[#F2F2F5]"
              >
                <item.icon className="h-4 w-4" />
              </button>
            ))}
            <span className="ml-auto text-xs text-[#8A8FA3]">{count} / 600 mots</span>
          </div>
          {warning ? <p className="border-b border-[#1E2130] px-4 py-2 text-sm text-[#F2C15A]">{warning}</p> : null}
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label="Votre rédaction"
            suppressContentEditableWarning
            onInput={note}
            onPaste={(event) => {
              pasteRef.current += event.clipboardData.getData("text").length;
            }}
            data-placeholder="Rédigez votre analyse ici."
            className={`${piece ? "min-h-60" : "min-h-[min(50vh,480px)]"} w-full px-5 py-4 text-base leading-7 text-[#F2F2F5] outline-none empty:before:text-[#8A8FA3] empty:before:content-[attr(data-placeholder)]`}
          />
        </section>
      </div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1E2130] pt-4">
        <p className="text-xs text-[#8A8FA3]">
          {ago == null ? "La rédaction reste sur cette page jusqu'à l'envoi." : `Enregistré il y a ${ago} s`}
        </p>
        <PassageButton onClick={() => { if (count > 0) setConfirm(true); }}>Envoyer ma réponse</PassageButton>
      </footer>
      {confirm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md rounded-3xl bg-[#15171E] p-6">
            <p className="text-sm text-[#B4B8C8]">Vous ne pourrez plus modifier votre réponse.</p>
            <div className="mt-4 flex gap-3">
              <PassageButton onClick={() => send()}>Envoyer</PassageButton>
              <button type="button" onClick={() => setConfirm(false)} className="text-sm text-[#B4B8C8]">Revenir</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DossierList({
  materials,
  activeId,
  onOpen,
}: {
  materials: CaseMaterial[];
  activeId: string;
  onOpen: (piece: OpenPiece) => void;
}) {
  const [pieces, setPieces] = useState<OpenPiece[]>([]);
  const [status, setStatus] = useState("");
  const materialsRef = useRef(materials);
  materialsRef.current = materials;
  const signature = materials.map((item) => `${item.id}:${item.url ?? ""}:${item.name}`).join("|");

  useEffect(() => {
    const materials = materialsRef.current;
    let cancelled = false;
    const direct: OpenPiece[] = materials.flatMap((item) => {
      if (item.kind === "note") return [{ id: item.id, name: item.name, kind: "note" as const, text: item.text }];
      if (!item.url || /\.zip($|\?)/i.test(`${item.name} ${item.url}`)) return [];
      return [{ id: item.id, name: item.name, kind: pieceKind(item.name), url: item.url }];
    });
    const zips = materials.filter((item) => item.url && /\.zip($|\?)/i.test(`${item.name} ${item.url}`));
    setPieces(direct);
    if (zips.length === 0) {
      setStatus("");
      return;
    }
    setStatus("Ouverture du dossier…");
    void Promise.all(zips.map(async (item) => {
      const response = await fetch(item.url!);
      if (!response.ok) throw new Error("dossier");
      const entries = await readCaseZip(await response.arrayBuffer());
      return entries.map((entry) => ({
        id: `${item.id}:${entry.name}`,
        name: entry.name,
        kind: pieceKind(entry.name),
        data: entry.data,
      }));
    }))
      .then((groups) => {
        if (cancelled) return;
        const opened = groups.flat();
        setPieces([...direct, ...opened]);
        setStatus(opened.length ? "" : "Le dossier ne contient aucune pièce lisible.");
      })
      .catch(() => {
        if (!cancelled) setStatus("Le dossier ne s'ouvre pas. Restez sur cette page.");
      });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  if (pieces.length === 0 && !status) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-[#8A8FA3]">Pièces du dossier</p>
      {status ? <p className="text-sm text-[#B4B8C8]">{status}</p> : null}
      {pieces.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item)}
          className={`block w-full rounded-2xl border px-3 py-2 text-left text-sm ${activeId === item.id ? "border-[#6E5BFF] text-[#F2F2F5]" : "border-[#1E2130] text-[#C9C2FF]"}`}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

function PieceView({ piece, onClose }: { piece: OpenPiece; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [sheets, setSheets] = useState<Array<{ name: string; rows: string[][] }>>([]);
  const [sheet, setSheet] = useState(0);

  useEffect(() => {
    if (piece.kind === "image" && piece.data) {
      const next = URL.createObjectURL(fileBlob(piece.data, ""));
      setUrl(next);
      return () => URL.revokeObjectURL(next);
    }
    if (piece.kind === "image" && piece.url) setUrl(piece.url);
    if (piece.kind !== "sheet") return;
    let cancelled = false;
    void (async () => {
      try {
        const bytes = piece.data ?? (piece.url ? new Uint8Array(await (await fetch(piece.url)).arrayBuffer()) : null);
        if (!bytes || cancelled) return;
        const xlsx = await import("xlsx");
        if (cancelled) return;
        const book = xlsx.read(bytes, { type: "array" });
        setSheets(book.SheetNames.map((name) => ({
          name,
          rows: (xlsx.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: false }) as unknown[][]).map((row) => row.map((cell) => String(cell ?? ""))),
        })));
        setSheet(0);
      } catch {
        if (!cancelled) setSheets([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [piece]);

  const table = sheets[sheet];
  return (
    <div className="border-b border-[#1E2130]">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p className="truncate text-sm">{piece.name}</p>
        <button type="button" className="text-sm text-[#C9C2FF]" onClick={onClose}>Fermer la pièce</button>
      </div>
      {piece.kind === "pdf" ? <PdfPages name={piece.name} data={piece.data} url={piece.url} /> : null}
      {piece.kind === "image" && url ? <img src={url} alt="" className="max-h-[70vh] w-full object-contain" /> : null}
      {piece.kind === "other" ? <p className="px-4 py-3 text-sm text-[#B4B8C8]">Ce format ne s'affiche pas sur cette page.</p> : null}
      {piece.kind === "note" || piece.kind === "text" ? (
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap px-4 py-3 text-sm text-[#B4B8C8]">{piece.text || (piece.data ? new TextDecoder().decode(piece.data) : "")}</pre>
      ) : null}
      {piece.kind === "sheet" ? (
        <div className="px-4 pb-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {sheets.map((item, index) => (
              <button key={item.name} type="button" onClick={() => setSheet(index)} className={`rounded-full px-3 py-1 text-xs ${index === sheet ? "bg-[#6E5BFF] text-white" : "border border-[#1E2130] text-[#B4B8C8]"}`}>{item.name}</button>
            ))}
          </div>
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full text-left text-xs text-[#F2F2F5]">
              <tbody>
                {table?.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-[#1E2130]">
                    {row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-1 align-top">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PdfPages({ data, url }: { name: string; data?: Uint8Array; url?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const node = host.current;
    if (!node || (!data && !url)) return;
    let cancelled = false;
    const layers: Array<{ cancel: () => void }> = [];
    setError("");
    void (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument(data ? { data: data.slice() } : { url });
      const doc = await task.promise;
      if (cancelled) return;
      node.replaceChildren();
      const width = node.clientWidth || 640;
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, width / base.width) });
        const pageBox = document.createElement("div");
        pageBox.className = "passage-pdf-page";
        pageBox.style.width = `${viewport.width}px`;
        pageBox.style.height = `${viewport.height}px`;
        const rawWidth = (viewport.rawDims as { pageWidth?: number }).pageWidth || viewport.width;
        pageBox.style.setProperty("--scale-factor", String(viewport.width / rawWidth));
        const canvas = document.createElement("canvas");
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.display = "block";
        canvas.className = "bg-white";
        const textLayer = document.createElement("div");
        textLayer.className = "textLayer";
        pageBox.append(canvas, textLayer);
        node.appendChild(pageBox);
        const context = canvas.getContext("2d");
        if (!context) continue;
        const reader = new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: textLayer, viewport });
        layers.push(reader);
        await Promise.all([
          page.render({
            canvasContext: context,
            viewport,
            transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
          }).promise,
          reader.render(),
        ]);
      }
    })().catch(() => {
      if (!cancelled) setError("Cette pièce ne s'affiche pas.");
    });
    return () => {
      cancelled = true;
      for (const layer of layers) layer.cancel();
    };
  }, [data, url]);

  return (
    <div className="max-h-[70vh] overflow-auto px-3 py-3">
      {error ? <p className="text-sm text-[#B4B8C8]">{error}</p> : null}
      <div ref={host} />
    </div>
  );
}
