import { supabaseServer } from "@/lib/supabase/server";

export default async function BuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-semibold mb-3">Builder</h2>
        <p className="text-sm opacity-70">
          Placeholder du constructeur (sections/chapitres). À relier plus tard.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-semibold mb-3">Éditeur</h2>
        <p className="text-sm opacity-70">
          Placeholder de l'éditeur de contenu. À relier plus tard.
        </p>
      </div>
    </div>
  );
}

