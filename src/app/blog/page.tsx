import Link from "next/link";
import { posts } from "./content";

export const metadata = {
  title: "Blog & Ressources | nevo.",
  description: "Conseils, méthodes et ressources pour apprendre avec l'IA et la neuro-diversité.",
};

export default function BlogHomePage() {
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <h1 className="text-4xl md:text-5xl font-semibold text-[#0F1117] mb-4">Ressources nevo.</h1>
        <p className="text-[#6B7280] max-w-2xl">
          Des guides pratiques, des méthodes et des recherches pour apprendre plus efficacement avec
          l'IA et la neuro-diversité.
        </p>
      </section>

      {featured && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <Link
            href={`/blog/${featured.slug}`}
            className="block rounded-3xl border border-[#E8E9F0] bg-[#F8F9FC] p-8 hover:shadow-lg transition-all"
          >
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-3">
                  Article à la une
                </p>
                <h2 className="text-3xl font-semibold text-[#0F1117] mb-3">{featured.title}</h2>
                <p className="text-[#6B7280] mb-5">{featured.description}</p>
                <div className="text-sm text-[#9CA3AF]">
                  {featured.category} · {featured.readTime}
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="h-56 rounded-2xl bg-white border border-[#E8E9F0] flex items-center justify-center text-sm text-[#9CA3AF]">
                  Aperçu visuel
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-2xl border border-[#E8E9F0] bg-white p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-3">
                {post.category}
              </p>
              <h3 className="text-xl font-semibold text-[#0F1117] mb-3">{post.title}</h3>
              <p className="text-[#6B7280] mb-4">{post.description}</p>
              <div className="text-sm text-[#9CA3AF]">{post.readTime}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}