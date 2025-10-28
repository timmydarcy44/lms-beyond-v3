import { Mail } from "lucide-react";

export default function MessageCard({ unread }: { unread: number }) {
  const hasUnread = (unread || 0) > 0;
  return (
    <a href="/messages" className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 hover:bg-white/[0.05] transition block">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Mail className="w-6 h-6 text-white/90" aria-hidden />
          {hasUnread && (
            <span
              aria-label={`${unread} message(s) non lu(s)`}
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-[#e11d48] text-white text-xs grid place-items-center"
            >
              {unread}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm text-white/70">Messagerie</div>
          <div className="text-base">
            {hasUnread ? `${unread} non lu(s)` : "Aucun nouveau message"}
          </div>
        </div>
      </div>
    </a>
  );
}



