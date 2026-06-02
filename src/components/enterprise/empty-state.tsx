"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState(props: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
  onAction?: () => void;
  variant?: "dark" | "light";
}) {
  const light = props.variant === "light";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 text-center",
        light ? "border-gray-200 bg-gray-50/50" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className={cn("text-4xl", light ? "opacity-50" : "opacity-30")} aria-hidden>
        {props.icon}
      </div>
      <p className={cn("font-semibold", light ? "text-gray-800" : "text-white/60")}>{props.title}</p>
      <p className={cn("max-w-md text-sm", light ? "text-gray-500" : "text-white/30")}>{props.description}</p>
      {props.action ? (
        <Link
          href={props.action.href}
          className="mt-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          {props.action.label}
        </Link>
      ) : null}
      {props.onAction ? (
        <button
          type="button"
          onClick={props.onAction}
          className="mt-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          📂 Importer mon fichier CSV →
        </button>
      ) : null}
    </div>
  );
}
