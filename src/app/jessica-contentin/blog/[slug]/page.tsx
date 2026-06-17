import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import {
  getJessicaBlogPost,
  JESSICA_BLOG_POSTS,
} from "@/lib/jessica-contentin/jessica-blog-catalog";
import { JessicaBlogArticleView } from "@/components/jessica-contentin/blog/jessica-blog-article-view";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return JESSICA_BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getJessicaBlogPost(slug);
  if (!post) return {};

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    keywords: post.tags,
    alternates: { canonical: post.canonicalUrl },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: post.canonicalUrl,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function JessicaBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getJessicaBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      jobTitle: post.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "Jessica Contentin — Cabinet de psychopédagogie",
      url: "https://jessicacontentin.fr",
    },
    mainEntityOfPage: post.canonicalUrl,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <Script
        id={`blog-jsonld-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JessicaBlogArticleView post={post} />
    </>
  );
}
