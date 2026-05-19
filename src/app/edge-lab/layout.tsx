import { EdgeLabShell } from "@/components/edge-site/edge-lab-shell";

export default function EdgeLabLayout({ children }: { children: React.ReactNode }) {
  return <EdgeLabShell>{children}</EdgeLabShell>;
}
