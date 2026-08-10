import { useId } from "react";

/** Pictogrammes verre / frost — style Performanse, monochrome EDGE. */
export function SoftSkillsPicto({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id={`${id}-r`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Network nodes — soft skills collaboration */}
      <circle cx="100" cy="72" r="22" fill={`url(#${id}-g)`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <circle cx="100" cy="68" r="10" fill={`url(#${id}-r)`} />
      <path
        d="M78 118c0-14 10-24 22-24s22 10 22 24v6H78v-6z"
        fill={`url(#${id}-g)`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
      />
      <circle cx="52" cy="128" r="14" fill={`url(#${id}-g)`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <circle cx="148" cy="128" r="14" fill={`url(#${id}-g)`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <path
        d="M40 156c0-10 6-16 12-16s12 6 12 16"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
      />
      <path
        d="M136 156c0-10 6-16 12-16s12 6 12 16"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
      />
      <line x1="78" y1="110" x2="62" y2="124" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <line x1="122" y1="110" x2="138" y2="124" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <circle cx="64" cy="48" r="3.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="142" cy="52" r="2.5" fill="rgba(255,255,255,0.4)" />
      <circle cx="100" cy="168" r="2" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function IdmcPicto({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="15%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Cognitive crystal / prism */}
      <path
        d="M100 28 L168 70 L148 150 L52 150 L32 70 Z"
        fill={`url(#${id}-g)`}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.3"
      />
      <path d="M100 28 L100 150" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <path d="M32 70 L168 70" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <path d="M52 150 L100 70 L148 150" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.2" />
      <circle cx="100" cy="95" r="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      <circle cx="100" cy="95" r="6" fill="rgba(255,255,255,0.55)" />
      <circle cx="58" cy="56" r="2.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="150" cy="130" r="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export function DiscPicto({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* Behavioral compass rings */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="52"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="30" fill={`url(#${id}-core)`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" />
      <path
        d="M100 48 L106 92 L100 100 L94 92 Z"
        fill={`url(#${id}-g)`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.8"
      />
      <circle cx="100" cy="38" r="5" fill="rgba(255,255,255,0.7)" />
      <circle cx="162" cy="100" r="4" fill="rgba(255,255,255,0.45)" />
      <circle cx="38" cy="100" r="4" fill="rgba(255,255,255,0.35)" />
      <circle cx="100" cy="162" r="4" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export function ProductPicto({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  if (slug === "idmc") return <IdmcPicto className={className} />;
  if (slug === "test-comportemental" || slug === "psychologie-comportementale") {
    return <DiscPicto className={className} />;
  }
  return <SoftSkillsPicto className={className} />;
}
