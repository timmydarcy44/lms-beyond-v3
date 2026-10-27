import Link from "next/link";
import { EmptyState, ExpertPageFrame, ExpertPageHeader } from "@/components/expert/expert-ui";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpertResultatsPage() {
  const session = await getSession();
  const db = getServiceRoleClient();
  const games = session?.id && db
    ? (await db.from("serious_game_attempts").select("id,game_id,score,status,started_at").eq("user_id", session.id).order("started_at", { ascending: false }).limit(20)).data ?? []
    : [];

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Mes résultats" subtitle="Tests, quiz et jeux interactifs que vous avez réalisés." />
      {games.length === 0 ? (
        <EmptyState title="Aucun résultat pour le moment" text="Les scores des quiz et jeux interactifs apparaîtront ici." />
      ) : (
        <ul className="space-y-2">
          {games.map((row) => (
            <li key={row.id}>
              <Link href={`/dashboard/expert/jeux/${row.id}`} className="block rounded-[24px] bg-[#12141A] p-4">
                <p className="font-extrabold">{row.game_id}</p>
                <p className="text-sm text-[#B5BAC6]">{row.status}{row.score != null ? ` · ${row.score}` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ExpertPageFrame>
  );
}
