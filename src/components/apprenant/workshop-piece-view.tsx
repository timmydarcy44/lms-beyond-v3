import type { WorkshopPiece } from "@/types/course-builder";

export function pieceKindLabel(piece: WorkshopPiece) {
  if (piece.type === "mail") return "Mail";
  if (piece.type === "note") return "Note";
  if (piece.type === "donnees") return "Tableau";
  return "Fichier";
}

export function PieceDocument({ piece }: { piece: WorkshopPiece }) {
  if (piece.type === "mail") {
    return (
      <article className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#0B1122]">
        <header className="space-y-3 border-b border-[#1A2340] px-5 py-4">
          <p>
            <span className="block text-xs text-white/50">De</span>
            <span className="text-base font-semibold">{piece.de?.trim() || "Expéditeur non indiqué"}</span>
          </p>
          <p>
            <span className="block text-xs text-white/50">Objet</span>
            <span className="text-base">{piece.objet?.trim() || piece.titre}</span>
          </p>
        </header>
        {piece.contenu?.trim() ? <p className="whitespace-pre-wrap px-5 py-4 text-base leading-relaxed text-white/90">{piece.contenu}</p> : null}
      </article>
    );
  }
  if (piece.type === "note") return <NoteBody text={piece.contenu ?? ""} />;
  if (piece.type === "donnees") {
    return (
      <div className="max-w-full overflow-x-auto rounded-[24px] border border-[#1A2340]">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#111831]">
            <tr>
              {piece.colonnes.map((column, columnIndex) => (
                <th key={`${column}-${columnIndex}`} className="whitespace-nowrap border-b border-[#26304F] px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {piece.lignes.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-[#0B1122]">
                {piece.colonnes.map((column, cellIndex) => (
                  <td key={`${column}-${cellIndex}`} className="whitespace-nowrap border-b border-[#1A2340] px-3 py-2 text-white/85">
                    {row[cellIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <FilePreview titre={piece.titre} url={piece.url ?? ""} />;
}

function NoteBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <article className="rounded-[24px] border border-[#1A2340] bg-[#F4F1EA] px-5 py-6 text-[#0A0F1E]">
      <div className="space-y-2 text-base leading-relaxed">
        {lines.map((line, index) => {
          if (line.startsWith("# ")) return <h3 key={index} className="text-xl font-semibold">{line.slice(2)}</h3>;
          if (line.startsWith("## ")) return <h4 key={index} className="text-lg font-semibold">{line.slice(3)}</h4>;
          if (line.startsWith("- ") || line.startsWith("* ")) return <li key={index} className="ml-5 list-disc">{line.slice(2)}</li>;
          if (!line.trim()) return <div key={index} className="h-2" />;
          return <p key={index}>{line}</p>;
        })}
      </div>
    </article>
  );
}

function FilePreview({ titre, url }: { titre: string; url: string }) {
  const clean = url.split("?")[0].toLowerCase();
  const image = /\.(png|jpe?g|webp|gif)$/.test(clean);
  const pdf = clean.endsWith(".pdf");
  if (!url) return <p className="text-sm text-white/70">Ce fichier n’a pas encore d’adresse.</p>;
  return (
    <div className="space-y-3">
      {image ? <img src={url} alt="" className="max-h-[70vh] w-full rounded-2xl object-contain" /> : null}
      {pdf ? <iframe title={titre} src={url} className="h-[70vh] w-full rounded-2xl bg-white" /> : null}
      <a href={url} download className="inline-flex min-h-11 items-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white">
        Télécharger
      </a>
    </div>
  );
}
