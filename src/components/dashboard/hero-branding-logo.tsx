"use client";

type HeroBrandingLogoProps = {
  brandingLogo: string | null;
  className?: string;
};

const DEFAULT_LOGO_CLASS =
  "absolute top-4 left-1/2 -translate-x-1/2 z-50 w-32 h-auto object-contain";

export function HeroBrandingLogo({ brandingLogo, className }: HeroBrandingLogoProps) {
  if (!brandingLogo) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandingLogo}
      alt="Logo"
      className={className ?? DEFAULT_LOGO_CLASS}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
