"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type EmbeddedLessonResourceProps = {
  resourceId: string;
  title?: string;
};

type ResourcePayload = {
  title?: string;
  type?: string;
  resource_type?: string;
  kind?: string;
  html_content?: string | null;
  file_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
};

const HTML_IFRAME_SANDBOX =
  "allow-scripts allow-forms allow-same-origin allow-modals allow-popups allow-downloads";

function resolveMediaType(resource: ResourcePayload): string {
  const t = String(resource.type ?? resource.resource_type ?? resource.kind ?? "").toLowerCase();
  if (t === "pdf" || t === "document" || t === "guide" || t === "fiche") return "pdf";
  if (t === "video") return "video";
  if (t === "audio") return "audio";
  if (t === "html") return "html";
  if (resource.html_content?.trim()) return "html";
  if (resource.video_url) return "video";
  if (resource.audio_url) return "audio";
  if (resource.file_url) return "pdf";
  return "document";
}

function InteractiveHtmlFrame({ html, title }: { html: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(720);

  const resize = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    const next = Math.max(
      doc.body.scrollHeight,
      doc.documentElement?.scrollHeight ?? 0,
      480,
    );
    setHeight(Math.min(next + 24, 12000));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;

    const onLoad = () => {
      resize();
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      observer?.disconnect();
      observer = new ResizeObserver(() => resize());
      observer.observe(doc.body);
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [html, resize]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={html}
      sandbox={HTML_IFRAME_SANDBOX}
      className="w-full rounded-2xl border border-slate-200 bg-white"
      style={{ height, minHeight: 480 }}
    />
  );
}

export function EmbeddedLessonResource({ resourceId, title }: EmbeddedLessonResourceProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<ResourcePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/resources/${resourceId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || data.details || "Impossible de charger la ressource.");
        }
        return data.resource as ResourcePayload;
      })
      .then((payload) => {
        if (!cancelled) setResource(payload);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur de chargement.");
          setResource(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-12 text-slate-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement de la ressource…
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-slate-800 shadow-sm">
        <p className="font-semibold">{title || "Ressource"}</p>
        <p className="mt-2 text-sm text-slate-600">{error ?? "Ressource introuvable."}</p>
      </div>
    );
  }

  const mediaType = resolveMediaType(resource);
  const displayTitle = resource.title || title || "Ressource";
  const htmlContent = resource.html_content?.trim() ?? "";

  if (mediaType === "html" && htmlContent) {
    return (
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <InteractiveHtmlFrame html={htmlContent} title={displayTitle} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold leading-tight text-slate-900">{displayTitle}</h3>

      {mediaType === "pdf" && resource.file_url ? (
        <iframe
          src={resource.file_url}
          title={displayTitle}
          className="h-[75vh] w-full rounded-2xl border border-slate-200"
        />
      ) : null}

      {mediaType === "video" && (resource.video_url || resource.file_url) ? (
        <video
          controls
          className="aspect-video w-full rounded-2xl border border-slate-200 bg-black"
          src={resource.video_url || resource.file_url || undefined}
        />
      ) : null}

      {mediaType === "audio" && (resource.audio_url || resource.file_url) ? (
        <audio controls className="w-full" src={resource.audio_url || resource.file_url || undefined}>
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      ) : null}

      {mediaType === "html" && !htmlContent ? (
        <p className="text-sm text-slate-600">Le contenu HTML de cette ressource est vide.</p>
      ) : null}

      {mediaType !== "html" && !resource.file_url && !resource.video_url && !resource.audio_url ? (
        <p className="text-sm text-slate-600">Fichier de la ressource non disponible.</p>
      ) : null}
    </div>
  );
}
