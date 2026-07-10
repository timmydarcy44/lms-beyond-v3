import type { Metadata } from "next";

import { EdgeOpenBadgesPage } from "@/components/edge-site/business/edge-open-badges-page";

export const metadata: Metadata = {
  title: "Open Badges — EDGE Business",
  description:
    "Attribuez des badges certifiants pour rendre visibles les compétences acquises et partagées.",
};

export default function Page() {
  return <EdgeOpenBadgesPage />;
}
