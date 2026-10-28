"use client";

import Link, { type LinkProps } from "next/link";
import { createContext, useContext, type ReactNode } from "react";
import { toCareHref } from "@/lib/care/host";

const CareHostContext = createContext(false);

export function CareHostProvider({ publicHost, children }: { publicHost: boolean; children: ReactNode }) {
  return <CareHostContext.Provider value={publicHost}>{children}</CareHostContext.Provider>;
}

export function useCarePublicHost() {
  return useContext(CareHostContext);
}

export function CareLink({
  href,
  ...props
}: LinkProps & { href: string; children: ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const publicHost = useCarePublicHost();
  return <Link href={toCareHref(href, publicHost)} {...props} />;
}

export function careFormAction(action: string, publicHost: boolean) {
  return toCareHref(action, publicHost);
}
