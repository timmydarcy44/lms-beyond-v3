import { Manrope } from "next/font/google";
import { SeoWorkspace } from "@/components/super-admin/seo/seo-workspace";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-seo" });

export default function SuperSeoPage() {
  return (
    <div className={`${manrope.variable} ${manrope.className}`}>
      <SeoWorkspace />
    </div>
  );
}
