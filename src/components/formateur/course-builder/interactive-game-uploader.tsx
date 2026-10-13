"use client";

import { useState } from "react";
import { Gamepad2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readInteractiveGameZip } from "@/lib/course-builder/interactive-game";

type Props = {
  value: string;
  onChange: (url: string) => void;
  light?: boolean;
};

export function InteractiveGameUploader({ value, onChange, light = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

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
        form.set("file", new Blob([item.data]), item.path.split("/").pop() ?? "file");
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
