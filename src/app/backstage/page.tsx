import { getServiceRoleClient } from "@/lib/supabase/server";
import { verifyBackstageToken } from "@/lib/formation-documents/backstage-signed-url";
import { redirect } from "next/navigation";
import { formationDocumentPublicUrl } from "@/lib/formation-documents/public-url";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function BackstagePublicPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const bt = String(sp.bt ?? "");
  const sig = String(sp.sig ?? "");
  const verified = verifyBackstageToken(bt, sig);
  if (!verified.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F0EC] px-4 text-[#111]">
        <div className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold">Lien Backstage invalide</h1>
          <p className="mt-2 text-sm text-[#5C6578]">
            Ce lien a expiré ou n&apos;est plus valide. Ouvrez votre espace formateur ou
            demandez un renvoi à Byound.
          </p>
          <a
            href="https://www.byound.fr/dashboard/formateur"
            className="mt-6 inline-block rounded-xl bg-[#6E5BFF] px-5 py-3 text-sm font-bold text-white"
          >
            Mon espace →
          </a>
        </div>
      </main>
    );
  }

  const { payload } = verified;
  if (payload.doc && (payload.k === "programme" || payload.k === "livret" || payload.k === "support")) {
    redirect(formationDocumentPublicUrl(payload.doc));
  }

  if (payload.k === "emarger" && payload.slot) {
    redirect(`/e?slot=${encodeURIComponent(payload.slot)}&bt=${encodeURIComponent(bt)}&sig=${encodeURIComponent(sig)}`);
  }

  if (payload.k !== "participants" || !payload.dossier) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F0EC] px-4">
        <p className="text-sm text-[#5C6578]">Ressource Backstage inconnue.</p>
      </main>
    );
  }

  const service = getServiceRoleClient();
  if (!service) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F0EC] px-4">
        <p className="text-sm text-[#5C6578]">Service indisponible.</p>
      </main>
    );
  }

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, course_title, organization_id")
    .eq("id", payload.dossier)
    .maybeSingle();

  const { data: org } = dossier?.organization_id
    ? await service
        .from("organizations")
        .select("name")
        .eq("id", dossier.organization_id)
        .maybeSingle()
    : { data: null };

  const { data: parts } = await service
    .from("formation_participants")
    .select("id, profile_id, job_title")
    .eq("dossier_id", payload.dossier);

  const profileIds = (parts ?? []).map((p) => String(p.profile_id));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };

  const byId = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  const rows = (parts ?? []).map((p) => {
    const profile = byId.get(String(p.profile_id));
    const name =
      String(profile?.full_name ?? "").trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      String(profile?.email ?? "Participant");
    return {
      name,
      job: p.job_title ? String(p.job_title) : "Fonction non renseignée",
    };
  });

  return (
    <main className="min-h-screen bg-[#F1F0EC] px-4 py-10 text-[#111]">
      <div className="mx-auto max-w-lg rounded-[28px] bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#6E5BFF]">
          Byound Backstage
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">Participants</h1>
        <p className="mt-1 text-sm text-[#5C6578]">
          {String(dossier?.course_title || "Formation")}
          {org?.name ? ` · ${org.name}` : ""}
        </p>
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li
              key={`${r.name}-${r.job}`}
              className="rounded-2xl border border-[#E6E4DF] px-4 py-3"
            >
              <div className="font-bold">{r.name}</div>
              <div className="text-sm text-[#5C6578]">{r.job}</div>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="text-sm text-[#5C6578]">Aucun participant inscrit.</li>
          ) : null}
        </ul>
      </div>
    </main>
  );
}
