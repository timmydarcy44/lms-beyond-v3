export default async function FormationEditPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org, id } = await params;
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Édition formation</h2>
      <p className="text-sm text-neutral-400">
        Org: <code>{org}</code> — Formation: <code>{id}</code>
      </p>
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-neutral-400">
        Builder à réintégrer (sections/chapitres/ressources/tests).
      </div>
    </div>
  );
}
