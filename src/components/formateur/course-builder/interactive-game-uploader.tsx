"use client";

import { useState } from "react";
import { Gamepad2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readInteractiveGameZip } from "@/lib/course-builder/interactive-game";

type GameDraft = {
  title: string;
  hook: string;
  duration_min: string;
  steps_count: string;
  skills: string;
  characterName: string;
  characterRole: string;
  introLine: string;
  cover_url: string;
  opening: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  onMeta?: (meta: {
    title?: string;
    hook?: string;
    duration_min?: number | null;
    steps_count?: number | null;
    skills?: string[];
    character?: { name?: string; role?: string; intro_line?: string } | null;
    cover_url?: string | null;
    opening?: string | null;
  }) => void;
  light?: boolean;
};

const emptyDraft = (): GameDraft => ({
  title: "",
  hook: "",
  duration_min: "",
  steps_count: "",
  skills: "",
  characterName: "",
  characterRole: "",
  introLine: "",
  cover_url: "",
  opening: "",
});

function publishMeta(draft: GameDraft, onMeta?: Props["onMeta"]) {
  const skills = draft.skills.split(",").map((item) => item.trim()).filter(Boolean);
  const duration = Number(draft.duration_min);
  const steps = Number(draft.steps_count);
  onMeta?.({
    title: draft.title.trim(),
    hook: draft.hook.trim(),
    duration_min: Number.isFinite(duration) && duration > 0 ? duration : null,
    steps_count: Number.isFinite(steps) && steps > 0 ? steps : null,
    skills,
    character: draft.characterName.trim()
      ? { name: draft.characterName.trim(), role: draft.characterRole.trim(), intro_line: draft.introLine.trim() }
      : null,
    cover_url: draft.cover_url.trim() || null,
    opening: draft.opening.trim() || null,
  });
}

export function InteractiveGameUploader({ value, onChange, onMeta, light = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [draft, setDraft] = useState<GameDraft | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Importez un fichier .zip contenant le jeu.");
      return;
    }
    setBusy(true);
    setProgress("Lecture du zip…");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { files, entry } = await readInteractiveGameZip(bytes);
      const packageId = crypto.randomUUID();
      let entryUrl = "";
      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];
        setProgress(`${index + 1} / ${files.length}`);
        const form = new FormData();
        form.set("packageId", packageId);
        form.set("path", item.path);
        const bytes = item.data;
        const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        form.set("file", new Blob([copy]), item.path.split("/").pop() ?? "file");
        const response = await fetch("/api/course-builder/interactive-game", { method: "POST", body: form });
        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!response.ok || !payload?.url) {
          throw new Error(payload?.error || "L'import du jeu a échoué.");
        }
        if (item.path === entry) entryUrl = payload.url;
      }
      if (!entryUrl) throw new Error("Le point d'entrée index.html n'a pas été publié.");
      const manifestFile = files.find((item) => /(^|\/)jeu\.json$/i.test(item.path));
      const manifest = manifestFile ? new TextDecoder().decode(manifestFile.data) : null;
      const registered = await fetch("/api/course-builder/interactive-game/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest, entryUrl }),
      });
      const registration = (await registered.json().catch(() => null)) as { ok?: boolean; reason?: string } | null;
      onChange(entryUrl);
      let parsed: Record<string, unknown> = {};
      try {
        parsed = manifest ? (JSON.parse(manifest) as Record<string, unknown>) : {};
      } catch {
        parsed = {};
      }
      const character = parsed.character && typeof parsed.character === "object" ? (parsed.character as Record<string, unknown>) : {};
      const indexFile = files.find((item) => /(^|\/)index\.html$/i.test(item.path));
      const excerpt = indexFile
        ? new TextDecoder().decode(indexFile.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000)
        : "";
      const current = {
        title: typeof parsed.title === "string" ? parsed.title : file.name.replace(/\.zip$/i, ""),
        hook: typeof parsed.hook === "string" ? parsed.hook : "",
        duration_min: parsed.duration_min,
        steps_count: parsed.steps_count,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        character,
        opening: typeof parsed.opening === "string" ? parsed.opening : "",
      };
      let proposal = current;
      try {
        const proposed = await fetch("/api/course-builder/interactive-game/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excerpt, current }),
        });
        const body = (await proposed.json().catch(() => null)) as { proposal?: typeof current } | null;
        if (body?.proposal) proposal = { ...current, ...body.proposal };
      } catch {
        /* la fiche reste modifiable sans proposition */
      }
      const nextDraft: GameDraft = {
        title: String(proposal.title ?? ""),
        hook: String(proposal.hook ?? ""),
        duration_min: proposal.duration_min ? String(proposal.duration_min) : "",
        steps_count: proposal.steps_count ? String(proposal.steps_count) : "",
        skills: Array.isArray(proposal.skills) ? proposal.skills.map(String).join(", ") : "",
        characterName: String((proposal.character as Record<string, unknown>)?.name ?? ""),
        characterRole: String((proposal.character as Record<string, unknown>)?.role ?? ""),
        introLine: String((proposal.character as Record<string, unknown>)?.intro_line ?? ""),
        cover_url: "",
        opening: String(proposal.opening ?? ""),
      };
      setDraft(nextDraft);
      publishMeta(nextDraft, onMeta);
      if (registration?.ok) {
        toast.success("Jeu interactif importé.");
      } else {
        toast.success("Jeu interactif importé.", {
          description: registration?.reason || "La fiche jeu.json n'a pas été enregistrée. Les parties seront suivies sans contrôle des résultats.",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L'import du jeu a échoué.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        light ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5",
      )}
    >
      <div className="flex items-center gap-2">
        <Gamepad2 className={cn("h-4 w-4", light ? "text-slate-700" : "text-white/80")} />
        <p className={cn("text-sm font-semibold", light ? "text-slate-900" : "text-white")}>Jeu interactif</p>
      </div>
      <p className={cn("text-xs leading-relaxed", light ? "text-slate-500" : "text-white/50")}>
        Importez un zip qui contient le jeu et son fichier index.html. Les images, scripts et styles du dossier sont
        publiés avec lui.
      </p>
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold",
          light ? "bg-slate-900 text-white" : "bg-white text-slate-950",
          busy && "pointer-events-none opacity-60",
        )}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? progress || "Import…" : "Importer un fichier zip"}
        <input
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const next = event.target.files?.[0];
            event.target.value = "";
            void handleFile(next);
          }}
        />
      </label>
      {draft ? (
        <div className="grid gap-2">
          {(
            [
              ["title", "Titre du jeu"],
              ["hook", "Accroche"],
              ["duration_min", "Durée en minutes"],
              ["steps_count", "Nombre de situations"],
              ["skills", "Notions, séparées par des virgules"],
              ["characterName", "Personnage"],
              ["characterRole", "Rôle"],
              ["introLine", "Phrase d’introduction"],
              ["opening", "Début de la première situation"],
              ["cover_url", "Image de couverture"],
            ] as Array<[keyof GameDraft, string]>
          ).map(([key, label]) => (
            <label key={key} className={cn("block text-xs", light ? "text-slate-600" : "text-white/70")}>
              {label}
              <input
                value={draft[key]}
                onChange={(event) => {
                  const next = { ...draft, [key]: event.target.value };
                  setDraft(next);
                  publishMeta(next, onMeta);
                }}
                className={cn(
                  "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
                  light ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-transparent text-white",
                )}
              />
            </label>
          ))}
        </div>
      ) : null}
      {value ? (
        <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2", light ? "border-slate-200 bg-white" : "border-white/10")}>
          <p className={cn("truncate text-xs", light ? "text-slate-600" : "text-white/70")}>{value}</p>
          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
