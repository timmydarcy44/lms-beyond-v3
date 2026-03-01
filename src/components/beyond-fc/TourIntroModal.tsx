 "use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TourIntroModalProps = {
  open: boolean;
  title: string;
  description: string;
  videoSrc?: string;
  caption?: string;
  onSkip: () => void;
  onContinue: () => void;
};

export function TourIntroModal({
  open,
  title,
  description,
  videoSrc,
  caption,
  onSkip,
  onContinue,
}: TourIntroModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onSkip()}>
      <DialogContent className="max-h-[88vh] w-full max-w-4xl overflow-hidden border border-white/10 bg-slate-950/85 p-0 text-white backdrop-blur-xl">
        <DialogHeader className="space-y-3 border-b border-white/8 bg-gradient-to-r from-slate-900/95 to-slate-950/80 px-8 py-6 text-left">
          <DialogTitle className="text-2xl font-semibold text-white">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-white/70">
            {description}
          </DialogDescription>
        </DialogHeader>

        {videoSrc ? (
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              controls
              autoPlay
              playsInline
              preload="metadata"
            >
              <source src={videoSrc} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        ) : null}

        {caption ? (
          <div className="px-8 pt-4 text-xs uppercase tracking-[0.3em] text-white/50">{caption}</div>
        ) : null}

        <DialogFooter className="flex flex-col gap-3 px-8 pb-8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center rounded-full border border-white/12 bg-white/5 text-sm text-white/70 hover:text-white sm:w-auto"
            onClick={onSkip}
          >
            Passer l’introduction
          </Button>
          <Button
            type="button"
            className="w-full justify-center rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(8,37,83,0.45)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-auto"
            onClick={onContinue}
          >
            Commencer le tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
