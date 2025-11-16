"use client";

import { Award, CheckCircle2, LogIn, Rocket } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export type ActivityFeedItem = {
  id: string;
  type: "login" | "enrollment" | "badge" | "publish";
  title: string;
  subtitle?: string;
  created_at: string;
};

const TYPE_ICON_MAP: Record<ActivityFeedItem["type"], React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-emerald-300" />,
  enrollment: <CheckCircle2 className="h-4 w-4 text-sky-300" />,
  badge: <Award className="h-4 w-4 text-amber-300" />,
  publish: <Rocket className="h-4 w-4 text-fuchsia-300" />,
};

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export const ActivityFeed = ({ items }: ActivityFeedProps) => {
  const badgePalette: Record<ActivityFeedItem["type"], string> = {
    login: "from-emerald-400/25 via-emerald-500/15 to-teal-500/10",
    enrollment: "from-sky-400/25 via-blue-500/15 to-indigo-500/10",
    badge: "from-amber-400/25 via-orange-500/15 to-rose-500/10",
    publish: "from-fuchsia-400/25 via-purple-500/15 to-blue-500/10",
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-white">
      <span className="pointer-events-none absolute -right-28 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,63,94,0.25),_transparent_75%)] blur-3xl" />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activité récente</h2>
        <a href="#" className="text-sm font-medium text-white/75 hover:text-white">
          Voir toutes les activités
        </a>
      </div>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-4 rounded-2xl border border-white/10 bg-gradient-to-br ${badgePalette[item.type]} p-4 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.25)]`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35">
              {TYPE_ICON_MAP[item.type]}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{item.title}</p>
              {item.subtitle ? <p className="mt-1 text-xs text-white/70">{item.subtitle}</p> : null}
            </div>
            <span className="text-xs text-white/60">
              {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};


