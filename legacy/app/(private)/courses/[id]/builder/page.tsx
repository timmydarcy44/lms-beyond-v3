export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Builder</h1>
      <p className="text-neutral-400">Course ID : {id}</p>
      {/* Ici tu remettras ton builder 2 colonnes (sections/chapitres/éditeur) */}
    </main>
  );
}
