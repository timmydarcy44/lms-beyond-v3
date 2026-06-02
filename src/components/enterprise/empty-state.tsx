"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState(props: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#e0e0d8] bg-[#f8f8f6] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
        <span aria-hidden>{props.icon}</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-[#1a1a2e]">{props.title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{props.description}</p>
      {props.action ? (
        <Button asChild className="mt-5 bg-[#4f46e5] hover:bg-[#4338ca]">
          <Link href={props.action.href}>{props.action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

