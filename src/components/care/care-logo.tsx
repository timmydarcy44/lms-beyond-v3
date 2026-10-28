import { CareLink } from "@/components/care/care-host";

export function CareLogo({ ink = false }: { ink?: boolean }) {
  return (
    <CareLink href="/care" className={`care-logo${ink ? " care-logo--ink" : ""}`}>
      <strong>Byound</strong>
      <span>Care</span>
    </CareLink>
  );
}
