import {
  ClipboardCheck,
  FileUp,
  Gamepad2,
  Mic,
  ScrollText,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { methodConfigLabel } from "@/lib/openbadges/badge-method-config";

const ICONS: Record<BadgeEvaluationMethodId, LucideIcon> = {
  qcm: ClipboardCheck,
  case_study: ScrollText,
  dictation: Mic,
  video: Video,
  pdf_upload: FileUp,
  playground: Gamepad2,
};

export function OpenBadgeMethodIcon({
  methodId,
  className = "h-5 w-5",
}: {
  methodId: string;
  className?: string;
}) {
  const Icon = ICONS[methodId as BadgeEvaluationMethodId] ?? ClipboardCheck;
  return <Icon className={className} aria-hidden />;
}

export function OpenBadgeMethodChip({ methodId }: { methodId: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white/90">
      <OpenBadgeMethodIcon methodId={methodId} className="h-4 w-4 text-[#FF3B30]" />
      {methodConfigLabel(methodId as BadgeEvaluationMethodId)}
    </span>
  );
}
