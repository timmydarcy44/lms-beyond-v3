"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail } from "lucide-react";

function xSuffix(n: number) {
  return n > 1 ? "s" : "";
}

export default function MessageCard({ unread }: { unread: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-[radial-gradient(120%_120%_at_0%_0%,#132418_0%,#0b0f14_60%)] border border-emerald-500/15 p-5 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="text-zinc-300 text-sm">Messagerie</div>
        {/* Pastille verte iMessage si non-lus */}
        {unread > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs">
            ● {unread} nouveau{xSuffix(unread)} message{xSuffix(unread)}
          </span>
        ) : (
          <span className="text-zinc-500 text-xs">Aucun nouveau message</span>
        )}
      </div>
      <div className="mt-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-black px-4 py-2 text-sm font-medium hover:brightness-95 transition"
        >
          <Mail className="h-4 w-4" />
          Ouvrir la messagerie
        </Link>
      </div>
    </motion.div>
  );
}



