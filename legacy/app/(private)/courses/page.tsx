import CourseCard from "@/components/courses/CourseCard";
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function deleteCourse(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const id = formData.get("id") as string;
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/courses");
}

export default async function CoursesPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <p className="text-neutral-400">Veuillez vous connecter.</p>
      </main>
    );
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id,title,description,category,cover_url")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Mes formations</h1>
          <p className="text-neutral-400">Gérez et créez vos parcours pédagogiques</p>
        </div>
        <Link
          href="/courses/new"
          className="rounded-xl border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
        >
          Créer une formation
        </Link>
      </div>

      {error && (
        <p className="text-red-400">Erreur de chargement des formations.</p>
      )}

      {!courses?.length ? (
        <div className="border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
          Aucune formation pour l'instant.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses!.map((c) => (
            <form key={c.id} action={deleteCourse}>
              <input type="hidden" name="id" value={c.id} />
              <CourseCard
                course={c}
                onDelete={(id) => {
                  const form = document.querySelector<HTMLFormElement>(`form input[name="id"][value="${id}"]`)?.closest("form");
                  form?.requestSubmit();
                }}
                onAssign={() => {
                  alert("Ouvre un modal d'assignation (à brancher)");
                }}
              />
            </form>
          ))}
        </div>
      )}
    </main>
  );
}
