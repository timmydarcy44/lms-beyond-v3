import { CareLink } from "@/components/care/care-host";

export const CARE_LOGO_WHITE =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Byound%20Care/byound-care_blanc_600px.png";

export function CareLogo() {
  return (
    <CareLink href="/care" className="care-logo">
      <img src={CARE_LOGO_WHITE} alt="Byound Care" width={180} height={36} />
    </CareLink>
  );
}
