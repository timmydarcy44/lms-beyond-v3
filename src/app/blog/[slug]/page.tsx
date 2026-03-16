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
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  author: string | null;
  reading_time: number | null;
  slug: string;
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else {
        console.error("[BlogPostPage] Error loading post");
      }
    } catch (error) {
      console.error("[BlogPostPage] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6A664]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-[#2F2A25] mb-4"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            Article non trouvé
          </h1>
          <Link href="/blog">
            <Button className="bg-[#C6A664] hover:bg-[#B88A44] text-white">
              Retour au blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      {post.cover_image_url && (
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto max-w-4xl px-6 pb-12 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link href="/blog">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20 mb-6"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au blog
                  </Button>
                </Link>
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p
                    className="text-xl text-white/90 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      textShadow: '0 1px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-white/80">
                  {post.published_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                  )}
                  {post.reading_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.reading_time} min de lecture</span>
                    </div>
                  )}
                  {post.author && (
                    <span>Par {post.author}</span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <article className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          {!post.cover_image_url && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <Link href="/blog">
                <Button
                  variant="ghost"
                  className="mb-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au blog
                </Button>
              </Link>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2F2A25] mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                {post.title}
              </h1>
              {post.excerpt && (
                <p
                  className="text-xl text-[#2F2A25]/80 mb-6"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 text-[#2F2A25]/70">
                {post.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                )}
                {post.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.reading_time} min de lecture</span>
                  </div>
                )}
                {post.author && (
                  <span>Par {post.author}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Article Content */}
          {post.content && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <div
                className="text-[#2F2A25] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </motion.div>
          )}
        </div>
      </article>
    </div>
  );
}

