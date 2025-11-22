import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { BeyondConnectPageContent } from "@/components/beyond-connect/beyond-connect-page";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BeyondConnectPage() {
  const supabase = await getServerClient();
  
  if (!supabase) {
    redirect("/login");
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/catalogue/connect");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020202] to-[#050505]">
      <BeyondConnectPageContent userId={user.id} />
    </div>
  );
}

