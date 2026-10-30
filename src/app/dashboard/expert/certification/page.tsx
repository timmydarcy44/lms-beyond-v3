import { CertifiedView } from "@/components/expert/space/certified-view";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";
import { loadExpertShopFormations } from "@/lib/expert/shop-formations";
import { loadExpertPoleState } from "@/lib/expert/poles";
import { loadExpertSpace } from "@/lib/expert/space-server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpertCertificationPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;
  const poles = await loadExpertPoleState();
  const care = poles.ready && poles.pole === "care";
  if (!care && String(params.payment ?? "").toLowerCase() === "success") {
    const session = await getSession();
    const supabase = await getServerClient();
    if (session?.id && supabase && !isJadeDemoEmail(session.email)) {
      await supabase.from("experts").update({ certification_status: "training" }).eq("id", session.id);
    }
  }
  const [space, formations] = await Promise.all([loadExpertSpace(), loadExpertShopFormations()]);
  return <CertifiedView certification={space.certification} formations={formations} care={care} />;
}
