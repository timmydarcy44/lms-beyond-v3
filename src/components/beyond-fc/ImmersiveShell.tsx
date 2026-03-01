"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ImmersiveShellProps = {
  children: ReactNode;
  backgroundUrl?: string;
  overlayClassName?: string;
  className?: string;
};

export function ImmersiveShell({
  children,
  backgroundUrl = "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Beyond%20FC/Bureau%20Beyond%20FC.png",
  overlayClassName,
  className,
}: ImmersiveShellProps) {
  return (
    <div className={cn("relative min-h-screen w-full bg-slate-950 text-white", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center blur-[3px]"
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
          backgroundColor: !backgroundUrl ? "#020617" : undefined,
          transform: "scale(1.02)",
        }}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 bg-slate-950/80 backdrop-blur-[1.5px]",
          overlayClassName,
        )}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
        {children}
      </div>
    </div>
  );
}

