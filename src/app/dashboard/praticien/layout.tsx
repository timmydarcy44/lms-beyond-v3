import type { ReactNode } from "react";
import { PraticienShell } from "@/components/praticien/praticien-shell";

export default function PraticienLayout({ children }: { children: ReactNode }) {
  return <PraticienShell>{children}</PraticienShell>;
}
