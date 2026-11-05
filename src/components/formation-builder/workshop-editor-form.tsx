"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { NotebookPen } from "lucide-react";

import type { WorkshopConfig, WorkshopCriterion, WorkshopField, WorkshopMode, WorkshopPiece } from "@/types/course-builder";
import { parseAtelierDraftText } from "@/lib/course-builder/import-structure";
import { emptyWorkshop, workshopMaxImprovements, workshopMode } from "@/lib/workshops/workshop-block";

type WorkshopEditorFormProps = {
  title: string;
  workshop?: WorkshopConfig | null;
  onTitle: (title: string) => void;
  onWorkshop: (workshop: WorkshopConfig) => void;
  appearance?: "light" | "dark";
};

const ATELIER_JSON_PLACEHOLDER = `{
  "type": "atelier",
  "title": "Répondre à Claire",
  "mission": "Rédigez la réponse.",
  "situation": "Le budget formation est contesté.",
  "personnage": { "nom": "Claire", "fonction": "Responsable budget", "description": "Elle veut une justification chiffrée." },
  "pieces": [
    { "type": "mail", "titre": "Demande de Claire", "de": "Claire Martin", "objet": "Budget", "contenu": "..." }
  ],
  "fields": [{ "label": "Votre réponse", "type": "long" }],
  "criteria": ["Répond au besoin", "Chiffres présents"],
  "max_improvements": 2
}`;

const lightField = "w-full rounded-2xl border border-[#E3E0D8] bg-white px-3 py-3 text-sm text-[#07080B] outline-none focus:border-[#6E5BFF]";
const darkField = "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none";

export function WorkshopEditorForm({
  title,
  workshop,
  onTitle,
  onWorkshop,
  appearance = "light",
}: WorkshopEditorFormProps) {
  const value = workshop ?? emptyWorkshop("evaluation");
  const mode = workshopMode(value);
  const light = appearance === "light";
  const field = light ? lightField : darkField;
  const label = light ? "text-sm font-semibold text-[#07080B]" : "text-sm font-semibold text-white";
  const hint = light ? "text-xs text-[#6B6F7A]" : "text-xs text-white/55";
  const fields = value.fields?.length ? value.fields : emptyWorkshop(mode).fields ?? [];
  const criteria = value.criteria?.length ? value.criteria : emptyWorkshop(mode).criteria ?? [];
  const pieces = value.pieces ?? [];
  const personnage = value.personnage ?? { nom: "", fonction: "", description: "" };
  const [uploadingId, setUploadingId] = useState("");
  const [uploadError, setUploadError] = useState("");

  const patch = (next: Partial<WorkshopConfig>) => onWorkshop({ ...value, ...next });
  const [jsonText, setJsonText] = useState("");
  const [jsonNotice, setJsonNotice] = useState("");
  const [jsonOk, setJsonOk] = useState(false);

  const applyJson = () => {
    const parsed = parseAtelierDraftText(jsonText);
    if (!parsed.ok) {
      setJsonOk(false);
      setJsonNotice(parsed.message);
      return;
    }
    onTitle(parsed.title);
    onWorkshop(parsed.workshop);
    setJsonOk(true);
    setJsonNotice("Formulaire rempli. Vous pouvez encore modifier les champs à la main.");
  };

  const setField = (id: string, next: Partial<WorkshopField>) => {
    patch({ fields: fields.map((item) => (item.id === id ? { ...item, ...next } : item)) });
  };
  const setCriterion = (id: string, next: Partial<WorkshopCriterion>) => {
    patch({ criteria: criteria.map((item) => (item.id === id ? { ...item, ...next } : item)) });
  };
  const setPieces = (next: WorkshopPiece[]) => patch({ pieces: next });
  const replacePiece = (id: string, next: WorkshopPiece) => setPieces(pieces.map((item) => (item.id === id ? next : item)));

  const uploadFile = async (piece: Extract<WorkshopPiece, { type: "fichier" }>, file: File) => {
    setUploadingId(piece.id);
    setUploadError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/workshops/piece", { method: "POST", credentials: "include", body });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; name?: string; error?: string };
      if (!response.ok || !payload.url) {
        setUploadError(payload.error || "Envoi impossible.");
        return;
      }
      replacePiece(piece.id, { ...piece, url: payload.url, titre: piece.titre.trim() || payload.name || piece.titre });
    } catch {
      setUploadError("Envoi impossible.");
    } finally {
      setUploadingId("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mode du bloc">
        {(
          [
            ["evaluation", "Évaluation"],
            ["atelier", "Atelier"],
          ] as const
        ).map(([id, name]) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => patch({ mode: id as WorkshopMode })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : light ? "border border-[#E3E0D8] bg-white" : "border border-white/15 text-white"}`}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className={hint}>
        {mode === "atelier"
          ? "Entraînement. Le retour ne compte ni pour un Open Badge ni pour une note."
          : "Épreuve. Le comportement de certification reste celui d'aujourd'hui."}
      </p>

      {mode === "atelier" ? (
        <div className={`space-y-3 rounded-[24px] border p-4 ${light ? "border-[#E3E0D8] bg-[#F7F6F2]" : "border-white/10 bg-white/5"}`}>
            <p className={label}>Créer depuis un JSON</p>
            <p className={hint}>Collez l'objet atelier. Les champs ci-dessous se remplissent, et restent modifiables à la main.</p>
            <textarea
              className={`${field} min-h-36 font-mono text-xs`}
              aria-label="JSON de l'atelier"
              placeholder={ATELIER_JSON_PLACEHOLDER}
              value={jsonText}
              onChange={(event) => {
                setJsonText(event.target.value);
                setJsonNotice("");
                setJsonOk(false);
              }}
            />
            <button
              type="button"
              onClick={applyJson}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              Remplir le formulaire
            </button>
            {jsonNotice ? <p className={`text-sm ${jsonOk ? (light ? "text-[#0E7A4B]" : "text-[#2FD08A]") : "text-[#B42318]"}`}>{jsonNotice}</p> : null}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className={label}>{mode === "atelier" ? "Titre de l'atelier" : "Titre"}</span>
        <input className={field} value={title} onChange={(event) => onTitle(event.target.value)} />
      </label>

      {mode === "atelier" ? (
        <>
          <label className="block space-y-2">
            <span className={label}>Situation</span>
            <textarea className={`${field} min-h-24`} value={value.situation ?? ""} onChange={(event) => patch({ situation: event.target.value })} />
          </label>
          <fieldset className="space-y-3">
            <legend className={label}>Personnage</legend>
            <p className={hint}>Optionnel. Nom, fonction, et ce qu’il attend.</p>
            <input className={field} aria-label="Nom du personnage" placeholder="Nom" value={personnage.nom ?? ""} onChange={(event) => patch({ personnage: { ...personnage, nom: event.target.value } })} />
            <input className={field} aria-label="Fonction du personnage" placeholder="Fonction" value={personnage.fonction ?? ""} onChange={(event) => patch({ personnage: { ...personnage, fonction: event.target.value } })} />
            <textarea className={`${field} min-h-24`} aria-label="Description du personnage" placeholder="Ce qu’il attend, son contexte" value={personnage.description ?? ""} onChange={(event) => patch({ personnage: { ...personnage, description: event.target.value } })} />
          </fieldset>
          <PieceFields
            pieces={pieces}
            field={field}
            label={label}
            hint={hint}
            uploadingId={uploadingId}
            uploadError={uploadError}
            onChange={setPieces}
            onUpload={uploadFile}
          />
          <label className="block space-y-2">
            <span className={label}>Votre mission</span>
            <textarea className={`${field} min-h-24`} value={value.brief ?? ""} onChange={(event) => patch({ brief: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className={label}>Exemple résolu</span>
            <textarea className={`${field} min-h-24`} value={value.example ?? ""} onChange={(event) => patch({ example: event.target.value })} />
          </label>

          <fieldset className="space-y-3">
            <legend className={label}>Questions</legend>
            <p className={hint}>De 1 à 6. Court = une ligne, long = un paragraphe.</p>
            {fields.map((item, index) => (
              <div key={item.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <input
                  className={field}
                  aria-label={`Étiquette du champ ${index + 1}`}
                  placeholder="Objectif 1 : être capable de…"
                  value={item.label}
                  onChange={(event) => setField(item.id, { label: event.target.value })}
                />
                <select
                  className={field}
                  aria-label={`Type du champ ${index + 1}`}
                  value={item.type}
                  onChange={(event) => setField(item.id, { type: event.target.value === "short" ? "short" : "long" })}
                >
                  <option value="short">Court</option>
                  <option value="long">Long</option>
                </select>
                <button
                  type="button"
                  className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  disabled={fields.length <= 1}
                  onClick={() => patch({ fields: fields.filter((row) => row.id !== item.id) })}
                >
                  Retirer
                </button>
                <input
                  className={`${field} sm:col-span-3`}
                  aria-label={`Indication du champ ${index + 1}`}
                  placeholder="Indication affichée dans le champ, optionnelle"
                  value={item.placeholder ?? ""}
                  onChange={(event) => setField(item.id, { placeholder: event.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={fields.length >= 6}
              onClick={() => patch({ fields: [...fields, { id: nanoid(), label: "", placeholder: "", type: "long" }] })}
            >
              <NotebookPen className="h-4 w-4" aria-hidden />
              Ajouter une question
            </button>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={label}>Critères de réussite</legend>
            <p className={hint}>De 2 à 6. L'apprenant les voit avant de répondre.</p>
            {criteria.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={field}
                  aria-label={`Critère ${index + 1}`}
                  value={item.label}
                  onChange={(event) => setCriterion(item.id, { label: event.target.value })}
                />
                <button
                  type="button"
                  className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  disabled={criteria.length <= 2}
                  onClick={() => patch({ criteria: criteria.filter((row) => row.id !== item.id) })}
                >
                  Retirer
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={criteria.length >= 6}
              onClick={() => patch({ criteria: [...criteria, { id: nanoid(), label: "" }] })}
            >
              Ajouter un critère
            </button>
          </fieldset>

          <label className="block space-y-2">
            <span className={label}>Améliorations autorisées</span>
            <input
              className={field}
              type="number"
              min={0}
              max={6}
              value={workshopMaxImprovements(value)}
              onChange={(event) => patch({ maxImprovements: workshopMaxImprovements({ maxImprovements: Number(event.target.value) }) })}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

function blankPiece(type: WorkshopPiece["type"]): WorkshopPiece {
  const id = nanoid();
  if (type === "mail") return { id, type, titre: "", de: "", objet: "", contenu: "" };
  if (type === "note") return { id, type, titre: "", contenu: "" };
  if (type === "fichier") return { id, type, titre: "", url: "" };
  return { id, type: "donnees", titre: "", colonnes: ["Colonne 1", "Colonne 2"], lignes: [["", ""]] };
}

function PieceFields({
  pieces,
  field,
  label,
  hint,
  uploadingId,
  uploadError,
  onChange,
  onUpload,
}: {
  pieces: WorkshopPiece[];
  field: string;
  label: string;
  hint: string;
  uploadingId: string;
  uploadError: string;
  onChange: (next: WorkshopPiece[]) => void;
  onUpload: (piece: Extract<WorkshopPiece, { type: "fichier" }>, file: File) => void;
}) {
  const update = (id: string, next: WorkshopPiece) => onChange(pieces.map((item) => (item.id === id ? next : item)));
  return (
    <fieldset className="space-y-3">
      <legend className={label}>Pièces</legend>
      <p className={hint}>Optionnel, 5 maximum. Mail, note, tableau ou fichier.</p>
      {pieces.map((piece, index) => (
        <div key={piece.id} className="space-y-2 rounded-[24px] border border-[#E3E0D8] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#6B6F7A]">
              {piece.type === "mail" ? "Mail" : piece.type === "note" ? "Note" : piece.type === "donnees" ? "Tableau" : "Fichier"} {index + 1}
            </span>
            <button type="button" className="text-sm font-semibold" onClick={() => onChange(pieces.filter((item) => item.id !== piece.id))}>
              Retirer
            </button>
          </div>
          <input className={field} aria-label={`Titre de la pièce ${index + 1}`} placeholder="Titre" value={piece.titre} onChange={(event) => update(piece.id, { ...piece, titre: event.target.value })} />
          {piece.type === "mail" ? (
            <>
              <input className={field} aria-label="Expéditeur" placeholder="De" value={piece.de ?? ""} onChange={(event) => update(piece.id, { ...piece, de: event.target.value })} />
              <input className={field} aria-label="Objet" placeholder="Objet" value={piece.objet ?? ""} onChange={(event) => update(piece.id, { ...piece, objet: event.target.value })} />
              <textarea className={`${field} min-h-24`} aria-label="Contenu du mail" placeholder="Contenu" value={piece.contenu ?? ""} onChange={(event) => update(piece.id, { ...piece, contenu: event.target.value })} />
            </>
          ) : null}
          {piece.type === "note" ? (
            <textarea className={`${field} min-h-24`} aria-label="Contenu de la note" placeholder="Titres avec # et listes avec - " value={piece.contenu ?? ""} onChange={(event) => update(piece.id, { ...piece, contenu: event.target.value })} />
          ) : null}
          {piece.type === "donnees" ? <DataPiece piece={piece} field={field} onChange={(next) => update(piece.id, next)} /> : null}
          {piece.type === "fichier" ? (
            <>
              <input className={field} aria-label="Adresse du fichier" placeholder="https://…" value={piece.url ?? ""} onChange={(event) => update(piece.id, { ...piece, url: event.target.value })} />
              <label className="inline-flex cursor-pointer rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold">
                {uploadingId === piece.id ? "Envoi…" : "Déposer un fichier"}
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.csv,.docx,application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUpload(piece, file);
                    event.target.value = "";
                  }}
                />
              </label>
            </>
          ) : null}
        </div>
      ))}
      {uploadError ? <p className="text-sm text-[#B42318]">{uploadError}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["mail", "Ajouter un mail"],
            ["note", "Ajouter une note"],
            ["donnees", "Ajouter un tableau"],
            ["fichier", "Ajouter un fichier"],
          ] as const
        ).map(([type, name]) => (
          <button
            key={type}
            type="button"
            className="rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={pieces.length >= 5}
            onClick={() => onChange([...pieces, blankPiece(type)])}
          >
            {name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function DataPiece({
  piece,
  field,
  onChange,
}: {
  piece: Extract<WorkshopPiece, { type: "donnees" }>;
  field: string;
  onChange: (next: Extract<WorkshopPiece, { type: "donnees" }>) => void;
}) {
  const colonnes = piece.colonnes.length ? piece.colonnes : ["Colonne 1"];
  const lignes = piece.lignes.length ? piece.lignes : [colonnes.map(() => "")];
  const setColumn = (index: number, value: string) => {
    const next = colonnes.map((item, itemIndex) => (itemIndex === index ? value : item));
    onChange({ ...piece, colonnes: next });
  };
  const setCell = (rowIndex: number, cellIndex: number, value: string) => {
    const next = lignes.map((row, index) => {
      const cells = colonnes.map((_, columnIndex) => row[columnIndex] ?? "");
      if (index === rowIndex) cells[cellIndex] = value;
      return cells;
    });
    onChange({ ...piece, lignes: next });
  };
  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {colonnes.map((column, index) => (
          <input key={index} className={`${field} w-36`} aria-label={`Colonne ${index + 1}`} value={column} onChange={(event) => setColumn(index, event.target.value)} />
        ))}
      </div>
      {lignes.map((row, rowIndex) => (
        <div key={rowIndex} className="flex min-w-max gap-2">
          {colonnes.map((_, cellIndex) => (
            <input
              key={cellIndex}
              className={`${field} w-36`}
              aria-label={`Ligne ${rowIndex + 1}, colonne ${cellIndex + 1}`}
              value={row[cellIndex] ?? ""}
              onChange={(event) => setCell(rowIndex, cellIndex, event.target.value)}
            />
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="text-sm font-semibold disabled:opacity-40"
          disabled={colonnes.length >= 8}
          onClick={() => onChange({ ...piece, colonnes: [...colonnes, `Colonne ${colonnes.length + 1}`], lignes: lignes.map((row) => [...colonnes.map((_, index) => row[index] ?? ""), ""]) })}
        >
          Ajouter une colonne
        </button>
        <button
          type="button"
          className="text-sm font-semibold disabled:opacity-40"
          disabled={lignes.length >= 30}
          onClick={() => onChange({ ...piece, colonnes, lignes: [...lignes, colonnes.map(() => "")] })}
        >
          Ajouter une ligne
        </button>
      </div>
    </div>
  );
}
