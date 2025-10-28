import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function createCourse(formData: FormData) {
  "use server"; // IMPORTANT

  const title = (formData.get("title") as string)?.trim() || "Sans titre";
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;

  const supabase = await supabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    redirect("/courses/new?error=unauth");
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({ title, description, category, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    // On encode le message pour debug (visible dans l'URL)
    const msg = encodeURIComponent(error?.message ?? "insert_failed");
    redirect(`/courses/new?error=${msg}`);
  }

  revalidatePath("/courses");
  redirect(`/courses/${data.id}/builder`);
}

export default function NewCoursePage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Créer une formation</h1>

      <form action={createCourse} className="space-y-5">
        <div>
          <label className="block mb-2 text-sm opacity-80">Titre</label>
          <input
            name="title"
            className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none"
            placeholder="Titre de la formation"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm opacity-80">Description</label>
          <textarea
            name="description"
            className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none min-h-[140px]"
            placeholder="Description (optionnel)"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm opacity-80">Catégorie</label>
          <select
            name="category"
            className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none"
            defaultValue=""
          >
            <option value="" disabled>Sélectionner…</option>
            <option>Business</option>
            <option>RH</option>
            <option>Tech</option>
            <option>Soft Skills</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 transition"
        >
          Créer
        </button>
      </form>
    </div>
  );
}
