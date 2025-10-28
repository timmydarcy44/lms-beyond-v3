export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const sb = await createSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Messagerie</h1>
        <p className="text-white/60 mt-1">Gérez vos communications avec les apprenants</p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-8 text-center">
        <h2 className="text-xl font-medium mb-2">Messagerie en cours de développement</h2>
        <p className="text-white/60">Cette fonctionnalité sera bientôt disponible.</p>
      </div>
    </div>
  );
}
