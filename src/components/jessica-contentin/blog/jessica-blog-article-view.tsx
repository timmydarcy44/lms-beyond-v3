import Link from "next/link";
import type { ComponentType } from "react";
import type { JessicaBlogPostMeta } from "@/lib/jessica-contentin/jessica-blog-catalog";
import { AutismeHas2026Article } from "@/components/jessica-contentin/blog/articles/autisme-has-2026";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

const ARTICLE_COMPONENTS: Record<string, ComponentType> = {
  "autisme-recommandations-has-2026": AutismeHas2026Article,
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function JessicaBlogArticleView({ post }: { post: JessicaBlogPostMeta }) {
  const ArticleBody = ARTICLE_COMPONENTS[post.slug];

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <header className="border-b border-[#E6D9C6]/60 bg-gradient-to-b from-[#FFFCF9] to-[#F8F5F0]">
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-8 md:pb-14 md:pt-12">
          <Link
            href="/jessica-contentin/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#5C5348] transition hover:text-[#C6A664]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au blog
          </Link>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#C6A664]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8B6914]">
              {post.category}
            </span>
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#E6D9C6] px-3 py-1 text-xs text-[#5C5348]"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#2F2A25] md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {post.title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#5C5348] md:text-xl">{post.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#7A6F62]">
            <span className="font-medium text-[#2F2A25]">{post.author}</span>
            <span aria-hidden>·</span>
            <span>{post.authorRole}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {post.readingTimeMinutes} min de lecture
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        {ArticleBody ? <ArticleBody /> : null}
      </div>
    </div>
  );
}
