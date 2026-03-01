import type { ReactNode } from "react";
import {
  Film,
  FolderKanban,
  Home,
  Layers,
  Library,
  ListChecks,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { LearnerNavIcon } from "@/components/dashboard/learner-nav-items";

export const learnerNavIconMap: Record<LearnerNavIcon, ReactNode> = {
  home: <Home className="h-4 w-4" />,
  film: <Film className="h-4 w-4" />,
  layers: <Layers className="h-4 w-4" />,
  library: <Library className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  checklist: <ListChecks className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  drive: <FolderKanban className="h-4 w-4" />,
  message: <MessageCircle className="h-4 w-4" />,
};


