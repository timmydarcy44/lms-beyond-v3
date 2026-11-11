import Link from "next/link";
import { Manrope } from "next/font/google";
import { surmesureBackHref } from "@/lib/training-courses/surmesure-ui";

const manrope = Manrope({ subsets: ["latin"] });

export function SurMesureShell({
  orgId,
  orgName,
  crumb,
  children,
}: {
  orgId: string;
  orgName: string;
  crumb: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={manrope.className}
      style={{ background: "#0A0F1E", color: "#F4F7FF", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-[960px] px-6 py-8">
        <p className="mb-3 text-sm text-[#8A93AE]">
          <Link href={surmesureBackHref(orgId)} className="hover:text-white">
            {orgName}
          </Link>
          <span className="mx-1.5">·</span>
          <Link href={surmesureBackHref(orgId)} className="hover:text-white">
            Sur-mesure
          </Link>
          <span className="mx-1.5">·</span>
          <span className="text-[#C9D2E8]">{crumb}</span>
        </p>
        {children}
      </div>
    </div>
  );
}
