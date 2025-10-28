"use client";
import Link from "next/link";

export default function MessageTopButton({ unread }: { unread: number }) {
  const has = unread > 0;
  return (
    <Link
      href="/messages"
      className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm"
      aria-label="Messagerie"
    >
      ✉️ <span>Messagerie</span>
      {has && (
        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-black/20 text-[12px] h-5 min-w-[20px] px-1">
          {unread}
        </span>
      )}
    </Link>
  );
}
