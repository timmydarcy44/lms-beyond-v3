"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { jeuxReviewBasePath } from "@/lib/dashboard/space";

/**
 * Lecteur du bloc « Jeu interactif ».
 * À utiliser à la place de l'iframe actuelle du bloc : il affiche le jeu importé et relaie
 * tous ses événements vers /api/serious-games/events, dans l'ordre.
 */
type Props = {
  src: string;          // URL de l'index.html importé
  title: string;
  blockId: string;      // identifiant du bloc dans la leçon
  courseId?: string;
  lessonId?: string;
  reviewBasePath?: string;
  /** Plein écran : l'iframe remplit le cadre au lieu d'une hauteur fixe. */
  fill?: boolean;
};

type GameMsg = { source: "byound-serious-game"; game: string; version: number; event: string; [k: string]: unknown };

export function GameBlockPlayer({ src, title, blockId, courseId, lessonId, reviewBasePath, fill = false }: Props) {
  const pathname = usePathname();
  const resolvedReviewBase = reviewBasePath || jeuxReviewBasePath(pathname);
  const ref = useRef<HTMLIFrameElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [height, setHeight] = useState(900);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [done, setDone] = useState<{ attemptId: string; score: number; passed: boolean } | null>(null);

  useEffect(() => {
    const send = (msg: GameMsg) => {
      const body = JSON.stringify({ ...msg, blockId, courseId, lessonId });
      queue.current = queue.current.then(async () => {
        const r = await fetch("/api/serious-games/events", { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }).then((res: any) => {
        if (msg.event === "completed" && res?.ok) { setStatus("saved"); setDone({ attemptId: res.attemptId, score: res.score, passed: res.passed }); }
      }).catch(() => { if (msg.event !== "state") setStatus("error"); });
    };

    const restore = async (game: string) => {
      try {
        const r = await fetch(`/api/serious-games/restore?blockId=${encodeURIComponent(blockId)}&game=${encodeURIComponent(game)}`);
        if (!r.ok) return;
        const { state, collection } = await r.json();
        if (state || collection) ref.current?.contentWindow?.postMessage({ source: "byound-lms", type: "restore", state, collection }, "*");
      } catch { /* le jeu démarre normalement */ }
    };

    function onMessage(e: MessageEvent) {
      // Seuls les messages de NOTRE iframe sont acceptés (son origine peut être « null » : cadre isolé)
      if (e.source !== ref.current?.contentWindow) return;
      const m = e.data as GameMsg;
      if (!m || m.source !== "byound-serious-game" || typeof m.game !== "string") return;
      switch (m.event) {
        case "resize": { const h = Number(m.height); if (h > 200 && h < 20000) setHeight(h); return; }
        case "ready": restore(m.game); return;
        case "started": setStatus("idle"); setDone(null); send(m); return;
        case "completed": setStatus("saving"); send(m); return;
        default: send(m);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [blockId, courseId, lessonId]);

  return (
    <div className={fill ? "flex h-full min-h-0 flex-col" : "flex flex-col gap-3"}>
      <iframe
        ref={ref}
        src={src}
        title={title}
        sandbox="allow-scripts allow-downloads allow-forms allow-popups allow-modals allow-pointer-lock"
        allow="autoplay; fullscreen"
        loading="lazy"
        className={fill ? "min-h-0 w-full flex-1 border-0" : "w-full rounded-2xl border-0"}
        style={fill ? undefined : { height }}
      />
      <div className={fill ? "flex shrink-0 flex-wrap items-center gap-3 bg-black px-4 py-3 text-sm text-white/80" : "flex flex-wrap items-center gap-3 text-sm text-muted-foreground"} aria-live="polite">
        {status === "saving" && <span>Enregistrement de votre résultat…</span>}
        {status === "error" && <span>Une partie de vos réponses n'a pas pu être enregistrée. Vérifiez votre connexion, puis rejouez.</span>}
        {status === "saved" && done && (
          <>
            <span>Résultat enregistré : {done.score}/100{done.passed ? ", jeu validé" : ""}.</span>
            <Link className={fill ? "font-medium text-white underline" : "font-medium text-foreground underline"} href={`${resolvedReviewBase}/${done.attemptId}`}>Revoir mes réponses</Link>
            <Link className={fill ? "font-medium text-white underline" : "font-medium text-foreground underline"} href={resolvedReviewBase}>Mon tableau de bord</Link>
          </>
        )}
      </div>
    </div>
  );
}
