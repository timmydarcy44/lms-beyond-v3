"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResourcePreviewButtonProps = {
  title: string;
  contentType?: "pdf" | "audio" | "video" | "document" | string;
  contentUrl?: string;
  className?: string;
};

const renderPreview = (type: string | undefined, url: string | undefined) => {
  if (!url) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Cette ressource n'est pas encore disponible en prévisualisation.
      </div>
    );
  }

  switch (type) {
    case "pdf":
    case "document":
      return (
        <iframe
          src={url}
          className="h-[70vh] w-full rounded-3xl border border-white/10 bg-black/40"
          title="Prévisualisation PDF"
        />
      );
    case "audio":
      return (
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <audio controls className="w-full">
            <source src={url} />
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    case "video":
      return (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/60">
          <video controls className="aspect-video w-full" src={url} />
        </div>
      );
    default:
      return (
        <iframe
          src={url}
          className="h-[70vh] w-full rounded-3xl border border-white/10 bg-black/40"
          title="Prévisualisation"
        />
      );
  }
};

export function ResourcePreviewButton({ title, contentType, contentUrl, className }: ResourcePreviewButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "w-full justify-center rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90",
            className,
          )}
        >
          Prévisualiser
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-[#0A0A0A] border-white/15 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{renderPreview(contentType, contentUrl)}</div>
      </DialogContent>
    </Dialog>
  );
}


