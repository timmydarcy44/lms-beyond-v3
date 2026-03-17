import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "../content";
import { TableOfContents } from "../components/TableOfContents";
import { ArticleCta } from "../components/ArticleCta";
import { AuthorBio } from "../components/AuthorBio";
import { SideCta } from "../components/SideCta";

type PageProps = {
  params: { slug: string };
};

export const generateStaticParams = async () => posts.map((post) => ({ slug: post.slug }));

export const generateMetadata = ({ params }: PageProps) => {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
};

export default function BlogArticlePage({ params }: PageProps) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
    >
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <Link href="/blog" className="text-sm text-white/80 hover:text-white">
          ← Retour aux ressources
        </Link>
        <div className="mt-8 rounded-3xl bg-white/90 backdrop-blur border border-white/40 p-8 lg:p-12 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-3">
                {post.category} · {post.readTime}
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#0F1117] mb-4">
                {post.title}
              </h1>
              <p className="text-[#6B7280] mb-10">{post.hero}</p>

              <article className="space-y-10 text-[#1A1A1A]">
                {post.sections.map((section) => (
                  <section key={section.id} id={section.id}>
                    <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-[#4B5563] leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                ))}
              </article>

              <div className="mt-12">
                <ArticleCta />
              </div>
            </div>

            <div className="w-full lg:w-72 space-y-6">
              <TableOfContents items={post.sections.map((s) => ({ id: s.id, title: s.title }))} />
              <AuthorBio author={post.author} />
              <SideCta href={post.ctaHref} label={post.ctaLabel} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}