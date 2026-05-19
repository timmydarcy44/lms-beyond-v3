import Link from "next/link";

import { EDGE_HREFS } from "@/lib/edge-site/constants";
import { getParcours } from "@/lib/parcours";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function PostulerSlugLayout({ children, params }: Props) {
  const { slug } = await params;
  const parcours = getParcours(slug);
  const backHref = parcours ? EDGE_HREFS.parcoursSlug(slug) : EDGE_HREFS.parcours;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/[0.04] bg-[#fafafa]/90 px-5 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={EDGE_HREFS.home} className="text-sm font-medium tracking-[0.12em] text-edge-black">
            EDGE
          </Link>
          <Link
            href={backHref}
            className="text-[13px] text-black/40 transition-colors hover:text-edge-black"
          >
            ← Retour au parcours
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
