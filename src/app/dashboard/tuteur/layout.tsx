import type { ReactNode } from "react";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import "@/styles/tutor-theme.css";

export default function TuteurLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tutor-theme">
      <JadeInternalFill>{children}</JadeInternalFill>
    </div>
  );
}
