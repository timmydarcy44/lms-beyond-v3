"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-500",
        className,
      )}
      {...props}
    />
  );
}

/** Panneau droit — thème bleu EDGE cohérent. */
export function PipelineDealSheet({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetOverlay />
        <SheetPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-indigo-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            "data-[state=open]:duration-700 data-[state=closed]:duration-500 ease-out",
          )}
          aria-describedby={undefined}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <SheetPrimitive.Title className="text-lg font-semibold text-white">
              {title}
            </SheetPrimitive.Title>
            <SheetPrimitive.Close className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </SheetPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

export function PipelineDealSheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-4 flex gap-2 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      {children}
    </div>
  );
}
