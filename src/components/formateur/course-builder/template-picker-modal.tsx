
"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";

export type TemplateDefinition = {
  id: string;
  label: string;
  description: string;
  previewVariant: "single" | "two-equal" | "two-asym" | "media-text" | "text-media" | "hero";
  html: string;
};

type TemplatePickerModalProps = {
  open: boolean;
  onClose: () => void;
  templates: TemplateDefinition[];
  onSelect: (template: TemplateDefinition) => Promise<boolean> | boolean;
};

const previewBase =
  "relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50";

function TemplatePreview({ variant }: { variant: TemplateDefinition["previewVariant"] }) {
  switch (variant) {
    case "single":
      return (
        <div className={previewBase}>
          <div className="h-16 w-[85%] rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
        </div>
      );
    case "two-equal":
      return (
        <div className={cn(previewBase, "grid grid-cols-2 gap-2 px-3")}>
          <div className="h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
          <div className="h-16 rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
        </div>
      );
    case "two-asym":
      return (
        <div className={cn(previewBase, "grid grid-cols-[35%_65%] gap-2 px-3")}>
          <div className="h-16 rounded-lg bg-gradient-to-br from-orange-200/70 to-orange-100" />
          <div className="h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
        </div>
      );
    case "media-text":
      return (
        <div className={cn(previewBase, "grid grid-cols-2 gap-2 px-3")}>
          <div className="h-16 rounded-lg bg-gradient-to-br from-indigo-200/60 to-indigo-100" />
          <div className="h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
        </div>
      );
    case "text-media":
      return (
        <div className={cn(previewBase, "grid grid-cols-2 gap-2 px-3")}>
          <div className="h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
          <div className="h-16 rounded-lg bg-gradient-to-br from-indigo-200/60 to-indigo-100" />
        </div>
      );
    case "hero":
      return (
        <div className={cn(previewBase, "flex flex-col gap-3 px-4 py-3")}>
          <div className="h-8 w-[75%] rounded-full bg-gradient-to-r from-slate-200 to-slate-100" />
          <div className="mx-auto h-8 w-[85%] rounded-lg bg-gradient-to-br from-indigo-200/70 to-indigo-100" />
        </div>
      );
    default:
      return (
        <div className={previewBase}>
          <div className="h-16 w-[85%] rounded-lg bg-slate-200" />
        </div>
      );
  }
}

export function TemplatePickerModal({ open, onClose, templates, onSelect }: TemplatePickerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const closeModal = useCallback(() => {
    console.info("[Templates] CLOSE_SET_OPEN_FALSE");
    onClose();
  }, [onClose]);

  const handleTemplateClick = useCallback(
    async (template: TemplateDefinition) => {
      if (isProcessing) return;
      console.info("[Templates] TEMPLATE_CLICK", { templateId: template.id });
      closeModal();
      setIsProcessing(true);
      const runInsertion = () => {
        console.info("[Templates] INSERT_DEFERRED", { templateId: template.id });
        Promise.resolve(onSelect(template))
          .then((result) => {
            console.info("[Templates] INSERT_RESULT", { templateId: template.id, result });
            return result;
          })
          .catch((error) => {
            console.error("[Templates] INSERT_ERROR", error);
            toast.error("Impossible d'insérer le modèle, réessayez.");
          })
          .finally(() => {
            setIsProcessing(false);
          });
      };

      try {
        setTimeout(runInsertion, 0);
      } catch (error) {
        console.error("[Templates] INSERT_SCHEDULE_ERROR", error);
        runInsertion();
      }
    },
    [closeModal, isProcessing, onSelect],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        console.info("[TemplatesModal] onOpenChange", value);
        if (value) {
          console.info("[Templates] OPEN");
        } else {
          closeModal();
        }
      }}
    >
      <DialogOverlay className="bg-slate-950/70" />
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[1100px] overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-0 shadow-2xl sm:max-w-[1100px]"
        style={{
          maxHeight: "calc(100vh - 32px)",
        }}
      >
        <DialogTitle className="sr-only">Choisir un modèle de mise en page</DialogTitle>
        <DialogDescription className="sr-only">
          Sélection d'un template de mise en page
        </DialogDescription>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-5">
          <div className="space-y-2 pr-6">
            <DialogTitle className="text-left text-xl font-semibold text-slate-900">
              Choisir un modèle de mise en page
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-slate-500">
              Insérez un canevas prêt à l’emploi, modifiez les textes et ajoutez vos médias en un clic.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Fermer"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => {
                console.info("[Templates] CLOSE_X");
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={cn(
                  "group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition focus:outline-none",
                  "hover:border-indigo-400 hover:bg-indigo-50/80 hover:shadow-md",
                  isProcessing && "pointer-events-none opacity-75",
                )}
                onClick={() => handleTemplateClick(template)}
              >
                <TemplatePreview variant={template.previewVariant} />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{template.label}</p>
                  <p className="text-xs text-slate-500">{template.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 py-4">
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              onClick={() => {
                console.info("[Templates] CLOSE_CANCEL");
              }}
            >
              Annuler
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

