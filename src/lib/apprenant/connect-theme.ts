export type ApprenantConnectVariant = "edge" | "jessica";

export type ConnectShellTheme = {
  shellAttr: ApprenantConnectVariant;
  rootClass: string;
  showBackdrop: boolean;
  brandTitle: string;
  brandSubtitle: string;
  brandCollapsedLetter: string;
  brandCollapsedClass: string;
  sidebarClass: string;
  sidebarHeaderBorder: string;
  sidebarFooterClass: string;
  collapseBtnClass: string;
  navActiveClass: string;
  navActiveCollapsedClass: string;
  navInactiveClass: string;
  navIconActive: string;
  navIconInactive: string;
  profileBorder: string;
  profileInitialClass: string;
  profileAvatarBg: string;
  profileNameClass: string;
  profileRoleClass: string;
  profileEditBtnClass: string;
  profileCollapsedBtnClass: string;
  helpLinkClass: string;
  neuroBtnClass: string;
  logoutBtnClass: string;
  mainClass: string;
  mobileHeaderClass: string;
  mobileTitleClass: string;
  mobileMenuBtnClass: string;
  mobileSheetClass: string;
  mobileNavActive: string;
  mobileNavInactive: string;
  mobileNavIconActive: string;
  mobileNavIconInactive: string;
  shareToastClass: string;
  shareToastBtnClass: string;
  signOutHref: string;
  mobileBrandFallback: string;
};

const EDGE_THEME: ConnectShellTheme = {
  shellAttr: "edge",
  rootClass: "relative min-h-screen bg-[#0D0D12]",
  showBackdrop: true,
  brandTitle: "EDGE",
  brandSubtitle: "Propulsé par Beyond",
  brandCollapsedLetter: "E",
  brandCollapsedClass: "mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-edge-red/10 text-xs font-semibold text-edge-red",
  sidebarClass: "no-dyslexia sticky left-0 top-0 z-20 hidden h-screen shrink-0 flex-col bg-[#0a0a0f] lg:flex",
  sidebarHeaderBorder: "border-b border-white/[0.06]",
  sidebarFooterClass: "shrink-0 space-y-2 border-t border-white/[0.06] bg-[#0a0a0f] p-2",
  collapseBtnClass:
    "ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition hover:border-edge-red/35 hover:bg-edge-red/10 hover:text-white",
  navActiveClass: "bg-[rgba(37,99,235,0.15)] text-white",
  navActiveCollapsedClass: "bg-[rgba(37,99,235,0.15)] text-white ring-1 ring-[rgba(37,99,235,0.25)]",
  navInactiveClass: "text-white/45 hover:bg-white/[0.04] hover:text-white",
  navIconActive: "text-[#60a5fa]",
  navIconInactive: "text-white/45 group-hover:text-white/70",
  profileBorder: "border-[rgba(37,99,235,0.35)]",
  profileInitialClass: "text-xs font-semibold text-[#60a5fa]",
  profileAvatarBg: "bg-[#111110]",
  profileNameClass: "truncate text-xs font-semibold text-white",
  profileRoleClass: "truncate text-[10px] text-white/45",
  profileEditBtnClass:
    "mt-2 w-full rounded-full border border-white/20 bg-transparent py-2 text-[11px] font-medium text-white/70 transition hover:border-white/30",
  profileCollapsedBtnClass:
    "mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-semibold text-[#E53935] transition hover:border-[#E53935]/40",
  helpLinkClass:
    "flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-transparent py-2 text-[11px] font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/70",
  neuroBtnClass:
    "flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-transparent py-2 text-[11px] font-medium text-white/55 transition hover:border-white/15 hover:bg-white/[0.03] hover:text-white/85",
  logoutBtnClass:
    "flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-medium text-white/25 transition hover:bg-white/[0.04] hover:text-white/40",
  mainClass: "relative flex-1 overflow-y-auto bg-transparent text-slate-100",
  mobileHeaderClass: "sticky top-0 z-30 border-b border-sky-500/10 bg-[#050810]/60 px-4 py-3 backdrop-blur-md lg:hidden",
  mobileTitleClass: "truncate text-center text-sm font-semibold text-white",
  mobileMenuBtnClass:
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-white/[0.06] text-slate-200",
  mobileSheetClass: "border-sky-500/15 bg-[#050810]/95 text-slate-100 backdrop-blur-xl",
  mobileNavActive: "bg-sky-500/15 text-white ring-1 ring-sky-400/30",
  mobileNavInactive: "text-slate-400 hover:bg-white/[0.04] hover:text-white",
  mobileNavIconActive: "text-sky-400",
  mobileNavIconInactive: "text-slate-500 group-hover:text-slate-300",
  shareToastClass: "max-w-md rounded-2xl border border-sky-500/20 bg-[#0a1020] px-6 py-5 text-center shadow-2xl shadow-black/50",
  shareToastBtnClass:
    "mt-4 rounded-full bg-[#6C5CE7] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(108,92,231,0.5)] hover:bg-[#7B6EF6]",
  signOutHref: "/particuliers",
  mobileBrandFallback: "EDGE",
};

const JESSICA_THEME: ConnectShellTheme = {
  shellAttr: "jessica",
  rootClass: "relative min-h-screen bg-[#F8F5F0]",
  showBackdrop: false,
  brandTitle: "Jessica",
  brandSubtitle: "Contentin · Espace apprenant",
  brandCollapsedLetter: "J",
  brandCollapsedClass:
    "mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#C6A664]/20 text-xs font-semibold text-[#8B4513]",
  sidebarClass:
    "no-dyslexia sticky left-0 top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-[#D2B48C]/40 bg-[#F0EBE3] lg:flex",
  sidebarHeaderBorder: "border-b border-[#D2B48C]/35",
  sidebarFooterClass: "shrink-0 space-y-2 border-t border-[#D2B48C]/35 bg-[#F0EBE3] p-2",
  collapseBtnClass:
    "ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#C6A664]/35 bg-white/60 text-[#8B4513]/80 transition hover:border-[#C6A664]/60 hover:bg-[#C6A664]/10 hover:text-[#654321]",
  navActiveClass: "bg-[#C6A664]/20 text-[#2F2A25]",
  navActiveCollapsedClass: "bg-[#C6A664]/20 text-[#2F2A25] ring-1 ring-[#C6A664]/35",
  navInactiveClass: "text-[#8B4513]/70 hover:bg-[#C6A664]/10 hover:text-[#654321]",
  navIconActive: "text-[#B8860B]",
  navIconInactive: "text-[#A0522D]/60 group-hover:text-[#8B4513]",
  profileBorder: "border-[#C6A664]/50",
  profileInitialClass: "text-xs font-semibold text-[#B8860B]",
  profileAvatarBg: "bg-[#F8F5F0]",
  profileNameClass: "truncate text-xs font-semibold text-[#2F2A25]",
  profileRoleClass: "truncate text-[10px] text-[#8B4513]/70",
  profileEditBtnClass:
    "mt-2 w-full rounded-full border border-[#C6A664]/40 bg-white/50 py-2 text-[11px] font-medium text-[#8B4513] transition hover:border-[#C6A664]/60 hover:bg-white/80",
  profileCollapsedBtnClass:
    "mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A664]/35 bg-white/60 text-xs font-semibold text-[#8B4513] transition hover:border-[#C6A664]/55",
  helpLinkClass:
    "flex w-full items-center justify-center gap-2 rounded-xl border border-[#D2B48C]/40 bg-white/40 py-2 text-[11px] font-medium text-[#8B4513]/75 transition hover:bg-white/70 hover:text-[#654321]",
  neuroBtnClass:
    "flex w-full items-center justify-center gap-2 rounded-xl border border-[#D2B48C]/40 bg-white/40 py-2 text-[11px] font-medium text-[#8B4513]/80 transition hover:border-[#C6A664]/45 hover:bg-white/70 hover:text-[#654321]",
  logoutBtnClass:
    "flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-medium text-[#A0522D]/50 transition hover:bg-[#C6A664]/10 hover:text-[#8B4513]",
  mainClass: "relative flex-1 overflow-y-auto bg-[#F8F5F0] text-[#2F2A25]",
  mobileHeaderClass:
    "sticky top-0 z-30 border-b border-[#D2B48C]/40 bg-[#F8F5F0]/95 px-4 py-3 backdrop-blur-md lg:hidden",
  mobileTitleClass: "truncate text-center text-sm font-semibold text-[#2F2A25]",
  mobileMenuBtnClass:
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A664]/35 bg-white/70 text-[#8B4513]",
  mobileSheetClass: "border-[#D2B48C]/40 bg-[#F8F5F0]/98 text-[#2F2A25] backdrop-blur-xl",
  mobileNavActive: "bg-[#C6A664]/20 text-[#2F2A25] ring-1 ring-[#C6A664]/35",
  mobileNavInactive: "text-[#8B4513]/75 hover:bg-[#C6A664]/10 hover:text-[#654321]",
  mobileNavIconActive: "text-[#B8860B]",
  mobileNavIconInactive: "text-[#A0522D]/60 group-hover:text-[#8B4513]",
  shareToastClass:
    "max-w-md rounded-2xl border border-[#C6A664]/30 bg-white px-6 py-5 text-center shadow-xl shadow-[#8B4513]/10",
  shareToastBtnClass:
    "mt-4 rounded-full bg-[#C6A664] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#B8860B]",
  signOutHref: "/jessica-contentin/login",
  mobileBrandFallback: "Jessica",
};

export function getConnectShellTheme(variant: ApprenantConnectVariant): ConnectShellTheme {
  return variant === "jessica" ? JESSICA_THEME : EDGE_THEME;
}

export type ApprenantPageTokens = {
  pageShell: string;
  pageKicker: string;
  pageTitle: string;
  pageLead: string;
  cardClass: string;
  cardBody: string;
  heroClass: string;
  cardInteractive: string;
  cardKicker: string;
  cardTitle: string;
  cardMuted: string;
  cardNote: string;
  btnPrimary: string;
  btnSecondary: string;
  progressTrack: string;
  progressFill: string;
  progressLabel: string;
  progressPct: string;
};

const EDGE_PAGE_TOKENS: ApprenantPageTokens = {
  pageShell: "relative space-y-6 md:space-y-8",
  pageKicker: "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]",
  pageTitle:
    "text-[clamp(1.45rem,2.5vw,1.85rem)] font-extrabold tracking-[-0.02em] text-white md:text-[clamp(1.95rem,3vw,2.4rem)]",
  pageLead: "max-w-2xl text-[13px] text-white/40",
  cardClass: "rounded-2xl border border-white/[0.06] bg-[#17171F]",
  cardBody: "rounded-2xl border border-white/[0.06] bg-[#17171F] flex flex-col gap-3 px-[20px] py-[18px] text-white",
  heroClass: "flex flex-col gap-4 rounded-2xl border border-white/[0.06] px-[20px] py-[18px] text-white",
  cardInteractive:
    "rounded-2xl border border-white/[0.06] bg-[#17171F] flex flex-col gap-3 px-[20px] py-[18px] text-white transition hover:border-sky-400/30 group",
  cardKicker: "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]",
  cardTitle: "text-[15px] font-extrabold tracking-[-0.02em] text-white",
  cardMuted: "text-[13px] text-white/40",
  cardNote: "rounded-2xl border border-white/[0.06] bg-[#1C1C28] px-[20px] py-[18px] text-[13px] text-white/40",
  btnPrimary:
    "inline-flex items-center justify-center rounded-[10px] bg-[#2563EB] px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-[#1D4ED8]",
  btnSecondary:
    "inline-flex items-center justify-center rounded-[10px] border border-white/[0.08] bg-transparent px-5 py-[11px] text-[13px] font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white/70",
  progressTrack: "h-[3px] overflow-hidden rounded-full bg-white/[0.07]",
  progressFill: "h-full rounded-full bg-[#2563EB] transition-all",
  progressLabel: "text-[13px] text-white/40",
  progressPct: "text-[13px] font-semibold text-white",
};

const JESSICA_PAGE_TOKENS: ApprenantPageTokens = {
  pageShell: "relative space-y-6 md:space-y-8",
  pageKicker: "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B8860B]",
  pageTitle:
    "text-[clamp(1.45rem,2.5vw,1.85rem)] font-extrabold tracking-[-0.02em] text-[#2F2A25] md:text-[clamp(1.95rem,3vw,2.4rem)]",
  pageLead: "max-w-2xl text-[13px] text-[#8B4513]/80",
  cardClass: "rounded-2xl border border-[#D2B48C]/45 bg-white/80",
  cardBody:
    "rounded-2xl border border-[#D2B48C]/45 bg-white/80 flex flex-col gap-3 px-[20px] py-[18px] text-[#2F2A25]",
  heroClass: "flex flex-col gap-4 rounded-2xl border border-[#D2B48C]/45 bg-white/70 px-[20px] py-[18px] text-[#2F2A25]",
  cardInteractive:
    "rounded-2xl border border-[#D2B48C]/45 bg-white/80 flex flex-col gap-3 px-[20px] py-[18px] text-[#2F2A25] transition hover:border-[#C6A664]/55 group",
  cardKicker: "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B8860B]",
  cardTitle: "text-[15px] font-extrabold tracking-[-0.02em] text-[#2F2A25]",
  cardMuted: "text-[13px] text-[#8B4513]/75",
  cardNote:
    "rounded-2xl border border-[#D2B48C]/40 bg-[#F0EBE3] px-[20px] py-[18px] text-[13px] text-[#8B4513]/80",
  btnPrimary:
    "inline-flex items-center justify-center rounded-[10px] bg-[#C6A664] px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-[#B8860B]",
  btnSecondary:
    "inline-flex items-center justify-center rounded-[10px] border border-[#C6A664]/40 bg-transparent px-5 py-[11px] text-[13px] font-semibold text-[#8B4513] transition hover:bg-[#C6A664]/10 hover:text-[#654321]",
  progressTrack: "h-[3px] overflow-hidden rounded-full bg-[#D2B48C]/35",
  progressFill: "h-full rounded-full bg-[#C6A664] transition-all",
  progressLabel: "text-[13px] text-[#8B4513]/75",
  progressPct: "text-[13px] font-semibold text-[#2F2A25]",
};

export function getApprenantPageTokens(variant: ApprenantConnectVariant): ApprenantPageTokens {
  return variant === "jessica" ? JESSICA_PAGE_TOKENS : EDGE_PAGE_TOKENS;
}
