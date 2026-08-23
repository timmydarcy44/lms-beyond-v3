"use client";

type OrgSidebarBrandProps = {
  logoUrl?: string | null;
  name?: string | null;
  /** Sous-titre optionnel (ex. Enterprise · Admin) — remplacé par Powered by EDGE si non fourni */
  showPoweredBy?: boolean;
  /** Version réduite (sidebar repliée) : logo seul */
  compact?: boolean;
  className?: string;
};

/** Logo au-dessus du nom, puis « Powered by EDGE » en petit. */
export function OrgSidebarBrand({
  logoUrl,
  name,
  showPoweredBy = true,
  compact = false,
  className,
}: OrgSidebarBrandProps) {
  const title = (name ?? "").trim() || "Organisation";

  if (compact) {
    return (
      <div className={className}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={title}
            className="mx-auto h-10 w-10 rounded-xl object-contain"
          />
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-white/70">
            {title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={title}
          className="mx-auto h-14 w-14 rounded-2xl object-contain"
        />
      ) : (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/70">
          {title.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="mt-3 truncate text-center text-base font-extrabold tracking-tight text-white">
        {title}
      </div>
      {showPoweredBy ? (
        <div className="mt-1 text-center text-[10px] font-medium tracking-[0.08em] text-white/40">
          Powered by EDGE
        </div>
      ) : null}
    </div>
  );
}
