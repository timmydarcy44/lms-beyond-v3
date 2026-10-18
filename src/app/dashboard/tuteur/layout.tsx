import type { ReactNode } from "react";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";

export default function TuteurLayout({ children }: { children: ReactNode }) {
  return <JadeInternalFill>{children}</JadeInternalFill>;
}
