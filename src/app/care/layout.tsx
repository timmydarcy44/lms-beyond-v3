import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { CareChrome } from "@/components/care/care-chrome";
import { CARE_PUBLIC_ORIGIN, isByoundCareHostname } from "@/lib/care/host";
import { CARE_SEO } from "@/lib/care/seo";
import "./care.css";

const careSans = Inter({
  subsets: ["latin"],
  variable: "--font-care",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(CARE_PUBLIC_ORIGIN),
  title: {
    default: CARE_SEO.siteName,
    template: "%s · Byound Care",
  },
  description: CARE_SEO.homeDescription,
};

export default async function CareLayout({ children }: { children: React.ReactNode }) {
  const publicHost = isByoundCareHostname((await headers()).get("host"));
  return (
    <div className={`care-root ${careSans.variable} ${careSans.className}`}>
      <CareChrome publicHost={publicHost}>{children}</CareChrome>
    </div>
  );
}
