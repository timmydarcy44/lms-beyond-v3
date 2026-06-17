import Link from "next/link";
import type { Metadata } from "next";
import { JESSICA_BLOG_POSTS } from "@/lib/jessica-contentin/jessica-blog-catalog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog Neuroéducation : Conseils psychopédagogiques & actualités",
  description:
    "Articles sur la neuroéducation, le TSA, l'orientation et l'accompagnement des enfants, adolescents et familles près de Caen.",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function JessicaBlogPage() {
  const [featured, ...rest] = JESSICA_BLOG_POSTS;

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="border-b border-[#E6D9C6]/50 bg-gradient-to-b from-[#FFFCF9] to-[#F8F5F0] py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Blog</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#2F2A25] md:text-5xl">
            Neuroéducation &amp; accompagnement
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#5C5348] md:text-xl">
            Analyses, décryptages et conseils pratiques pour les parents, enseignants et professionnels — rédigés par
            Jessica Contentin, psychopédagogue à Bretteville-sur-Odon.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl space-y-10 px-6">
          {featured ? (
            <article className="overflow-hidden rounded-3xl border border-[#E6D9C6] bg-white shadow-[0_20px_60px_-28px_rgba(47,42,37,0.15)]">
              <div className="grid md:grid-cols-5">
                <div className="flex flex-col justify-center p-8 md:col-span-3 md:p-10">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#C6A664]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B6914]">
                      À la une
                    </span>
                    <span className="rounded-full border border-[#E6D9C6] px-3 py-1 text-xs text-[#5C5348]">
                      {featured.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold leading-snug text-[#2F2A25] md:text-3xl">
                    <Link
                      href={`/jessica-contentin/blog/${featured.slug}`}
                      className="transition hover:text-[#8B6914]"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mt-4 line-clamp-3 text-base leading-relaxed text-[#5C5348] md:text-lg">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#7A6F62]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" aria-hidden />
                      {formatDate(featured.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" aria-hidden />
                      {featured.readingTimeMinutes} min
                    </span>
                  </div>
                  <Link
                    href={`/jessica-contentin/blog/${featured.slug}`}
                    className="mt-6 inline-flex items-center gap-2 font-semibold text-[#8B6914] transition hover:gap-3 hover:text-[#C6A664]"
                  >
                    Lire l&apos;article
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-[#F3E8D8] via-[#E6D9C6]/40 to-[#C6A664]/20 p-8 md:col-span-2 md:min-h-0">
                  <div className="text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">HAS 2026</p>
                    <p className="mt-2 text-3xl font-bold text-[#2F2A25]">TSA</p>
                    <p className="mt-2 text-sm text-[#5C5348]">Recommandations officielles</p>
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {rest.map((post) => (
                <article
                  key={post.slug}
                  className="flex h-full flex-col rounded-2xl border border-[#E6D9C6] bg-white p-6 transition hover:border-[#C6A664]/50 hover:shadow-lg"
                >
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#F3E8D8] px-3 py-1 text-xs font-medium text-[#8B6914]">
                    {post.category}
                  </span>
                  <h2 className="text-xl font-bold text-[#2F2A25]">
                    <Link href={`/jessica-contentin/blog/${post.slug}`} className="hover:text-[#8B6914]">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5C5348]">{post.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between text-xs text-[#7A6F62]">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>{post.readingTimeMinutes} min</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
