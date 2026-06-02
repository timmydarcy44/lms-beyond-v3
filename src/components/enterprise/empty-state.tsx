"use client";

import Link from "next/link";

export function EmptyState(props: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
      <div className="text-4xl opacity-30" aria-hidden>
        {props.icon}
      </div>
      <p className="font-semibold text-white/60">{props.title}</p>
      <p className="max-w-md text-sm text-white/30">{props.description}</p>
      {props.action ? (
        <Link
          href={props.action.href}
          className="mt-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          {props.action.label}
        </Link>
      ) : null}
    </div>
  );
}
