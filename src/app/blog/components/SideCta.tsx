"use client";

import Link from "next/link";

export function SideCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E9F0] bg-white/90 backdrop-blur px-6 py-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-2">À explorer</p>
      <p className="text-[#1A1A1A] font-semibold mb-3">{label}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#be1354] text-[#be1354] text-sm font-semibold hover:bg-[#be1354]/10"
      >
        Découvrir
      </Link>
    </div>
  );
}
